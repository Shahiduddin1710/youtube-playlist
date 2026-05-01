import os
import json
import time
from urllib.parse import urlparse, parse_qs

from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

TOKEN_FILE          = "token.json"
CLIENT_SECRETS_FILE = "client_secrets.json"

SCOPES = ["https://www.googleapis.com/auth/youtube"]


def extract_playlist_id(source: str) -> str:
    if source.startswith("http"):
        params = parse_qs(urlparse(source).query)
        if "list" not in params:
            raise ValueError(f"No 'list=' parameter found in URL: {source}")
        return params["list"][0]
    return source.strip()


def normalize_ranges(ranges: list, total_videos: int) -> list:
    normalized = []
    for (start, end) in ranges:
        if start < 1:
            start = 1
        if end > total_videos:
            end = total_videos
        if start > end:
            continue
        normalized.append((start, end))
    return normalized


def authenticate():
    creds = None

    if os.path.exists(TOKEN_FILE):
        creds = Credentials.from_authorized_user_file(TOKEN_FILE, SCOPES)

    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            if not os.path.exists(CLIENT_SECRETS_FILE):
                raise FileNotFoundError(
                    f"'{CLIENT_SECRETS_FILE}' not found. Download from Google Cloud Console."
                )
            flow = InstalledAppFlow.from_client_secrets_file(CLIENT_SECRETS_FILE, SCOPES)
            creds = flow.run_local_server(port=0)

        with open(TOKEN_FILE, "w") as f:
            f.write(creds.to_json())

    return build("youtube", "v3", credentials=creds)


def fetch_all_playlist_videos(youtube, playlist_id: str, label: str = "playlist") -> list:
    videos        = []
    next_page_tok = None

    while True:
        resp = youtube.playlistItems().list(
            part="snippet,contentDetails",
            playlistId=playlist_id,
            maxResults=50,
            pageToken=next_page_tok,
        ).execute()

        for item in resp.get("items", []):
            snippet  = item.get("snippet", {})
            video_id = snippet.get("resourceId", {}).get("videoId", "")
            title    = snippet.get("title", "")

            if not video_id or title in ("Deleted video", "Private video", "[Private video]"):
                continue

            videos.append({
                "index":   len(videos) + 1,
                "videoId": video_id,
                "title":   title,
            })

        next_page_tok = resp.get("nextPageToken")
        if not next_page_tok:
            break

    return videos


def fetch_existing_video_ids(youtube, playlist_id: str) -> set:
    existing      = set()
    next_page_tok = None

    while True:
        resp = youtube.playlistItems().list(
            part="snippet",
            playlistId=playlist_id,
            maxResults=50,
            pageToken=next_page_tok,
        ).execute()

        for item in resp.get("items", []):
            vid = item["snippet"].get("resourceId", {}).get("videoId", "")
            if vid:
                existing.add(vid)

        next_page_tok = resp.get("nextPageToken")
        if not next_page_tok:
            break

    return existing


def select_videos_by_ranges(all_videos: list, ranges: list) -> list:
    selected = []
    seen_ids = set()

    for (start, end) in ranges:
        for v in all_videos:
            if start <= v["index"] <= end and v["videoId"] not in seen_ids:
                seen_ids.add(v["videoId"])
                selected.append(v)

    return selected


def compute_videos_to_add(selected_videos: list, existing_ids: set) -> tuple:
    to_add  = []
    skipped = 0

    for video in selected_videos:
        if video["videoId"] in existing_ids:
            skipped += 1
        else:
            to_add.append(video)

    return to_add, skipped


def create_new_playlist(youtube, title: str, description: str, privacy: str) -> str:
    resp = youtube.playlists().insert(
        part="snippet,status",
        body={
            "snippet": {"title": title, "description": description},
            "status":  {"privacyStatus": privacy},
        }
    ).execute()
    return resp["id"]


def insert_videos_into_playlist(youtube, playlist_id: str, videos: list, log_fn=None):
    def log(type_, text):
        if log_fn:
            log_fn(type_, text)
        else:
            print(text)

    total = len(videos)
    log("info", f"Inserting {total} video(s) into playlist {playlist_id} ...")

    for i, video in enumerate(videos, start=1):
        vid   = video["videoId"]
        title = video["title"]
        src_i = video["index"]

        log("info", f"[{i}/{total}] (src #{src_i}) {title[:55]}")

        retries = 0
        while True:
            try:
                youtube.playlistItems().insert(
                    part="snippet",
                    body={
                        "snippet": {
                            "playlistId": playlist_id,
                            "resourceId": {
                                "kind":    "youtube#video",
                                "videoId": vid,
                            },
                        }
                    }
                ).execute()
                log("success", f"Inserted: {title[:50]}")
                break

            except HttpError as e:
                reason = ""
                try:
                    reason = json.loads(e.content)["error"]["errors"][0]["reason"]
                except Exception:
                    reason = str(e)

                if e.resp.status == 403 and "quotaExceeded" in reason:
                    log("error", f"Daily API quota exceeded at video {i}/{total}.")
                    log("warn",  "Quota resets at midnight Pacific Time.")
                    log("warn",  f"Resume: USE_EXISTING_PLAYLIST=True, TARGET_PLAYLIST_ID=\"{playlist_id}\"")
                    return

                elif e.resp.status in (500, 503):
                    retries += 1
                    if retries > 5:
                        log("error", f"Failed after 5 retries: {title[:50]}")
                        break
                    wait = 2 ** retries
                    log("warn", f"Server error {e.resp.status}, retry {retries}/5 in {wait}s...")
                    time.sleep(wait)

                elif e.resp.status == 404:
                    log("warn", f"Skipped (not available): {title[:50]}")
                    break

                else:
                    log("error", f"Skipped (HTTP {e.resp.status}: {reason}): {title[:40]}")
                    break

        time.sleep(0.3)

    log("success", "Insertion complete.")


def main():
    source_id = extract_playlist_id(SOURCE_PLAYLIST)

    youtube = authenticate()

    all_videos = fetch_all_playlist_videos(youtube, source_id, label="source")

    if not all_videos:
        print("ERROR: Source playlist is empty or inaccessible.")
        return

    valid_ranges = normalize_ranges(RANGES, len(all_videos))
    if not valid_ranges:
        print("ERROR: No valid ranges. Exiting.")
        return

    selected = select_videos_by_ranges(all_videos, valid_ranges)

    if not selected:
        print("ERROR: No videos selected. Check your RANGES.")
        return

    if USE_EXISTING_PLAYLIST:
        if TARGET_PLAYLIST_ID == "YOUR_EXISTING_PLAYLIST_ID_HERE":
            print("ERROR: Set TARGET_PLAYLIST_ID before running.")
            return

        target_id    = TARGET_PLAYLIST_ID
        existing_ids = fetch_existing_video_ids(youtube, target_id)
        to_add, skipped = compute_videos_to_add(selected, existing_ids)

        if not to_add:
            print("Target playlist already has all required videos.")
            return

        print(f"Selected: {len(selected)} | Already exists: {skipped} | To add: {len(to_add)}")

    else:
        target_id = create_new_playlist(
            youtube, NEW_PLAYLIST_TITLE, NEW_PLAYLIST_DESCRIPTION, NEW_PLAYLIST_PRIVACY
        )
        to_add = selected
        print(f"New playlist created. Inserting {len(to_add)} videos...")

    insert_videos_into_playlist(youtube, target_id, to_add)

    print(f"Done! https://www.youtube.com/playlist?list={target_id}")


if __name__ == "__main__":
    SOURCE_PLAYLIST = "https://youtube.com/playlist?list=PLu0W_9lII9agq5TrH9XLIKQvv0iaF2X3w"
    RANGES = [(3, 82), (105, 119)]
    USE_EXISTING_PLAYLIST = False
    TARGET_PLAYLIST_ID = "YOUR_EXISTING_PLAYLIST_ID_HERE"
    NEW_PLAYLIST_TITLE = "Web Tech"
    NEW_PLAYLIST_DESCRIPTION = "Selected Web Technology videos curated from source playlist."
    NEW_PLAYLIST_PRIVACY = "private"

    source_id = extract_playlist_id(SOURCE_PLAYLIST)