import sys
print("Starting app.py...", flush=True)

from flask import Flask, request, jsonify, Response
from flask_cors import CORS
import queue
import threading
import json

print("Flask imported ok", flush=True)

from playlist import (
    authenticate,
    extract_playlist_id,
    fetch_all_playlist_videos,
    fetch_existing_video_ids,
    select_videos_by_ranges,
    compute_videos_to_add,
    create_new_playlist,
    insert_videos_into_playlist,
    normalize_ranges,
)

print("playlist.py imported ok", flush=True)

app = Flask(__name__)
CORS(app)

_job_queues: dict[str, queue.Queue] = {}
_job_lock = threading.Lock()


def make_stream_log(q: queue.Queue):
    def stream_log(type_, text):
        q.put(json.dumps({"type": type_, "text": text}))
    return stream_log


def run_create_task(job_id, source_url, ranges, title, description, privacy):
    q = _job_queues[job_id]
    stream_log = make_stream_log(q)
    try:
        stream_log("info", "Authenticating with YouTube API...")
        youtube = authenticate()

        source_id = extract_playlist_id(source_url)
        stream_log("data", f"Source ID → {source_id}")

        stream_log("info", "Fetching source playlist...")
        all_videos = fetch_all_playlist_videos(youtube, source_id)
        stream_log("data", f"Total videos in source → {len(all_videos)}")

        stream_log("info", "Validating ranges...")
        valid_ranges = normalize_ranges(ranges, len(all_videos))
        if not valid_ranges:
            stream_log("error", "No valid ranges after validation.")
            return

        stream_log("info", "Selecting videos by range...")
        selected = select_videos_by_ranges(all_videos, valid_ranges)
        stream_log("data", f"Videos selected → {len(selected)}")

        stream_log("info", "Creating new playlist...")
        playlist_id = create_new_playlist(youtube, title, description, privacy)
        stream_log("success", f"Playlist created → {playlist_id}")

        stream_log("info", f"Inserting {len(selected)} videos...")
        insert_videos_into_playlist(youtube, playlist_id, selected, log_fn=stream_log)

        stream_log("success", "All done!")
        stream_log("data", f"URL → https://www.youtube.com/playlist?list={playlist_id}")
    except Exception as e:
        stream_log("error", str(e))
    finally:
        q.put("__DONE__")


def run_existing_task(job_id, source_url, dest_url, ranges):
    q = _job_queues[job_id]
    stream_log = make_stream_log(q)
    try:
        stream_log("info", "Authenticating with YouTube API...")
        youtube = authenticate()

        source_id = extract_playlist_id(source_url)
        target_id = extract_playlist_id(dest_url)
        stream_log("data", f"Source ID → {source_id}")
        stream_log("data", f"Target ID → {target_id}")

        stream_log("info", "Fetching source playlist...")
        all_videos = fetch_all_playlist_videos(youtube, source_id)
        stream_log("data", f"Total source videos → {len(all_videos)}")

        stream_log("info", "Validating ranges...")
        valid_ranges = normalize_ranges(ranges, len(all_videos))
        if not valid_ranges:
            stream_log("error", "No valid ranges after validation.")
            return

        stream_log("info", "Selecting videos by range...")
        selected = select_videos_by_ranges(all_videos, valid_ranges)
        stream_log("data", f"Videos selected → {len(selected)}")

        stream_log("info", "Scanning existing videos in target playlist...")
        existing_ids = fetch_existing_video_ids(youtube, target_id)
        stream_log("data", f"Already in target → {len(existing_ids)}")

        to_add, skipped = compute_videos_to_add(selected, existing_ids)
        stream_log("data", f"Skipping duplicates → {skipped}")
        stream_log("data", f"New videos to add   → {len(to_add)}")

        if not to_add:
            stream_log("success", "Target already has all required videos. Nothing to do.")
            return

        stream_log("info", f"Inserting {len(to_add)} videos...")
        insert_videos_into_playlist(youtube, target_id, to_add, log_fn=stream_log)

        stream_log("success", f"Done! Added {len(to_add)} videos, skipped {skipped}.")

    except Exception as e:
        stream_log("error", str(e))
    finally:
        q.put("__DONE__")


import uuid

@app.route("/api/create", methods=["POST"])
def create():
    data        = request.json
    source      = data.get("source", "")
    ranges      = [tuple(r) for r in data.get("ranges", [])]
    title       = data.get("title", "New Playlist")
    description = data.get("description", "")
    privacy     = data.get("privacy", "private")

    job_id = str(uuid.uuid4())
    with _job_lock:
        _job_queues[job_id] = queue.Queue()

    threading.Thread(
        target=run_create_task,
        args=(job_id, source, ranges, title, description, privacy),
        daemon=True
    ).start()

    return jsonify({"status": "started", "job_id": job_id})


@app.route("/api/existing", methods=["POST"])
def existing():
    data   = request.json
    source = data.get("source", "")
    dest   = data.get("destination", "")
    ranges = [tuple(r) for r in data.get("ranges", [])]

    job_id = str(uuid.uuid4())
    with _job_lock:
        _job_queues[job_id] = queue.Queue()

    threading.Thread(
        target=run_existing_task,
        args=(job_id, source, dest, ranges),
        daemon=True
    ).start()

    return jsonify({"status": "started", "job_id": job_id})


@app.route("/api/stream/<job_id>")
def stream(job_id):
    q = _job_queues.get(job_id)
    if not q:
        return jsonify({"error": "invalid job_id"}), 404

    def generate():
        try:
            while True:
                msg = q.get()
                if msg == "__DONE__":
                    yield f"data: {json.dumps({'type': 'done', 'text': ''})}\n\n"
                    break
                yield f"data: {msg}\n\n"
        finally:
            with _job_lock:
                _job_queues.pop(job_id, None)

    return Response(
        generate(),
        mimetype="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Access-Control-Allow-Origin": "*",
        }
    )


@app.route("/api/health")
def health():
    return jsonify({"status": "ok"})


if __name__ == "__main__":
    print("Flask server starting on http://localhost:5000", flush=True)
    app.run(debug=True, port=5000, use_reloader=False)