from flask import Flask, redirect, render_template, request, session, url_for
from datetime import datetime
from pathlib import Path
from urllib.parse import parse_qs, quote_plus, urlparse
from urllib.request import urlopen
import json
import os
import random
import secrets
import threading

app = Flask(__name__)
app.secret_key = os.environ.get("FLASK_SECRET_KEY", secrets.token_hex(16))

DATA_DIR = Path(app.root_path) / "data"
COMMENTS_PATH = DATA_DIR / "comments.json"
ENGAGEMENT_PATH = DATA_DIR / "engagement.json"
SETTINGS_PATH = DATA_DIR / "settings.json"
CONTENT_PATH = DATA_DIR / "site_content.json"
GALLERY_PATH = DATA_DIR / "gallery.json"
REPORTS_PATH = DATA_DIR / "reports.json"
ADMIN_CODE_PATH = DATA_DIR / "admin_code.txt"

LOCK = threading.Lock()
MAX_COMMENTS = 40
MAX_NAME_LENGTH = 40
MAX_MESSAGE_LENGTH = 280
BLOCKED_TERMS = ("spam", "scam", "nsfw", "hate")
BLOCKED_FILES = {"ipod-custom.png", "ipod-player.svg", "camera-preview.png"}
PREVIEW_CACHE_MINUTES = 30


def now_label():
    return datetime.now().strftime("%b %d, %Y %I:%M %p")


def read_json(path, default):
    if not path.exists():
        return default
    try:
        with path.open("r", encoding="utf-8") as file:
            data = json.load(file)
    except (OSError, json.JSONDecodeError):
        return default
    return data


def write_json(path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as file:
        json.dump(data, file, ensure_ascii=False, indent=2)


def ensure_admin_code():
    code = os.environ.get("COMMENT_ADMIN_CODE", "").strip()
    if code:
        return code
    if ADMIN_CODE_PATH.exists():
        return ADMIN_CODE_PATH.read_text(encoding="utf-8").strip()
    code = secrets.token_hex(4)
    ADMIN_CODE_PATH.parent.mkdir(parents=True, exist_ok=True)
    ADMIN_CODE_PATH.write_text(code, encoding="utf-8")
    return code


def load_content():
    default = {
        "hero": {
            "eyebrow": "Unofficial Duang With You Fanhub",
            "title": "DuangQin Dream Garden",
            "lead": "A softer, more curated fan space for slow-burn romance, comfort scenes, playlist feelings, and all the little DuangQin moments that stay with you.",
            "preferred_image": "DUANG WITH YOU TRAILER.jfif"
        },
        "reactions": {
            "kick": "Kicking my feet",
            "cry": "Crying in bed",
            "butterfly": "Butterflies"
        },
        "poll_options": {
            "confession": "Confession scene",
            "care": "Quiet care moments",
            "jealous": "Jealous chaos",
            "comfort": "Soft comfort ending"
        },
        "episode_briefs": [],
        "upcoming_preview": {
            "episode": 7,
            "release_date": "Mar 20, 2026",
            "headline": "Upcoming Episode",
            "title": "Official teaser placeholder",
            "summary": "Tap the camera screen to play the official next-episode teaser.",
            "source_label": "Official Mandee Work YouTube videos",
            "source_url": "https://www.youtube.com/@MandeeWork/videos",
            "video_id": "",
            "thumbnail_url": "/static/images/DUANG WITH YOU TRAILER.jfif"
        },
        "preview_feed": {
            "mode": "youtube_api",
            "channel_id": "",
            "playlist_id": "",
            "search_query": "Duang With You teaser",
            "search_terms": ["duang with you", "teaser", "preview", "ตัวอย่าง"]
        },
        "playlist_tracks": [],
        "quotes": [],
        "mood_tags": [],
        "playlist_notes": []
    }
    data = read_json(CONTENT_PATH, default)
    if not isinstance(data, dict):
        return default
    for key, value in default.items():
        data.setdefault(key, value)
    return data


def load_settings():
    default = {
        "featured_comment_id": None,
        "preview_status": "manual",
        "preview_cache": None,
        "preview_checked_at": None
    }
    data = read_json(SETTINGS_PATH, default)
    if not isinstance(data, dict):
        return default
    default.update(data)
    return default


def save_settings(settings):
    write_json(SETTINGS_PATH, settings)


def normalize_comment(item):
    return {
        "id": item.get("id") or secrets.token_hex(6),
        "name": str(item.get("name", "")).strip()[:MAX_NAME_LENGTH],
        "message": str(item.get("message", "")).strip()[:MAX_MESSAGE_LENGTH],
        "created_at": item.get("created_at") or now_label(),
        "approved": bool(item.get("approved", True))
    }


def load_comments():
    data = read_json(COMMENTS_PATH, [])
    if not isinstance(data, list):
        return []
    return [normalize_comment(item) for item in data[:MAX_COMMENTS] if isinstance(item, dict)]


def save_comments(comments):
    write_json(COMMENTS_PATH, comments[:MAX_COMMENTS])


def load_reports():
    data = read_json(REPORTS_PATH, [])
    if not isinstance(data, list):
        return []
    normalized = []
    for item in data:
      if isinstance(item, dict):
        normalized.append({
            "comment_id": item.get("comment_id", ""),
            "reason": item.get("reason", "report"),
            "created_at": item.get("created_at", now_label())
        })
    return normalized


def save_reports(reports):
    write_json(REPORTS_PATH, reports)


def load_engagement(content):
    default = {
        "reactions": {key: 0 for key in content["reactions"]},
        "poll": {key: 0 for key in content["poll_options"]}
    }
    data = read_json(ENGAGEMENT_PATH, default)
    if not isinstance(data, dict):
        return default
    reactions = data.get("reactions", {})
    poll = data.get("poll", {})
    return {
        "reactions": {key: int(reactions.get(key, 0)) for key in content["reactions"]},
        "poll": {key: int(poll.get(key, 0)) for key in content["poll_options"]}
    }


def save_engagement(data):
    write_json(ENGAGEMENT_PATH, data)


def load_gallery_metadata():
    data = read_json(GALLERY_PATH, {})
    if not isinstance(data, dict):
        return {}
    return data


def available_images():
    img_dir = Path(app.static_folder) / "images"
    files = []
    for file in img_dir.iterdir():
        if not file.is_file():
            continue
        if file.name.lower() in BLOCKED_FILES:
            continue
        if not file.name.lower().endswith((".jpg", ".jpeg", ".png", ".webp", ".jfif", ".avif")):
            continue
        if any(term in file.name.lower() for term in ("dolphin", "dolphine", "whale")):
            continue
        files.append(file.name)
    return files


def resolve_preferred_image(images, preferred_name):
    if not preferred_name:
        return None
    if preferred_name in images:
        return preferred_name
    preferred_lower = preferred_name.lower()
    return next((image for image in images if Path(image).name.lower() == preferred_lower), None)


def build_gallery_items(images, metadata):
    items = []
    for file_name in images:
        item = metadata.get(file_name, {})
        items.append({
            "file": file_name,
            "title": item.get("title", "Duang With You"),
            "caption": item.get("caption", "A favorite DuangQin memory."),
            "alt": item.get("alt", f"Duang With You still: {file_name}")
        })
    return items


def is_admin():
    return bool(session.get("is_admin", False))


def top_key(values):
    if not values:
        return None
    ranked = sorted(values.items(), key=lambda item: item[1], reverse=True)
    return ranked[0][0] if ranked and ranked[0][1] > 0 else None


def choose_featured_comment(comments, settings):
    approved = [comment for comment in comments if comment["approved"]]
    if not approved:
        return None
    featured_id = settings.get("featured_comment_id")
    featured = next((comment for comment in approved if comment["id"] == featured_id), None)
    return featured or approved[0]


def extract_youtube_video_id(url):
    parsed = urlparse(str(url or "").strip())
    if not parsed.netloc:
        return ""
    host = parsed.netloc.lower()
    if "youtu.be" in host:
        return parsed.path.strip("/").split("/")[0]
    if "youtube.com" in host:
        if parsed.path == "/watch":
            return parse_qs(parsed.query).get("v", [""])[0]
        if parsed.path.startswith("/embed/") or parsed.path.startswith("/shorts/"):
            return parsed.path.rstrip("/").split("/")[-1]
    return ""


def parse_timestamp(value):
    if not value:
        return None
    try:
        return datetime.fromisoformat(str(value).replace("Z", "+00:00"))
    except ValueError:
        return None


def preview_cache_is_fresh(settings):
    checked_at = parse_timestamp(settings.get("preview_checked_at"))
    if not checked_at:
        return False
    return (datetime.now(checked_at.tzinfo) - checked_at).total_seconds() < PREVIEW_CACHE_MINUTES * 60


def normalize_preview(preview, status, mode):
    preview = dict(preview or {})
    source_url = str(preview.get("source_url") or "").strip()
    video_id = str(preview.get("video_id") or "").strip() or extract_youtube_video_id(source_url)
    preview["title"] = str(preview.get("title") or "Official teaser placeholder").strip()
    preview["summary"] = str(preview.get("summary") or "").strip()
    preview["source_label"] = str(preview.get("source_label") or "Official YouTube teaser").strip()
    preview["source_url"] = source_url
    preview["thumbnail_url"] = str(preview.get("thumbnail_url") or "").strip()
    if video_id:
        preview["embed_url"] = f"https://www.youtube.com/embed/{video_id}?autoplay=1"
        preview["thumbnail_url"] = f"https://i.ytimg.com/vi/{video_id}/hqdefault.jpg"
        preview["video_id"] = video_id
    else:
        preview["embed_url"] = ""
        preview["video_id"] = ""
        preview["title"] = preview["title"] or "Official teaser not released yet"
        preview["summary"] = preview["summary"] or "The camera will switch to the newest official preview automatically once it is available."
        preview["thumbnail_url"] = "/static/images/DUANG WITH YOU TRAILER.jfif"
    preview["status"] = status
    preview["mode"] = mode
    return preview


def fetch_youtube_api_preview(content):
    api_key = os.environ.get("YOUTUBE_API_KEY", "").strip()
    feed = content.get("preview_feed", {})
    if not api_key:
        return None

    channel_id = str(feed.get("channel_id") or "").strip()
    playlist_id = str(feed.get("playlist_id") or "").strip()
    search_query = str(feed.get("search_query") or "Duang With You teaser").strip()
    search_terms = [str(term).strip().lower() for term in feed.get("search_terms", []) if str(term).strip()]
    if not channel_id and not playlist_id:
        return None

    if playlist_id:
        api_url = (
            "https://www.googleapis.com/youtube/v3/playlistItems"
            f"?part=snippet&maxResults=10&playlistId={playlist_id}&key={api_key}"
        )
    else:
        api_url = (
            "https://www.googleapis.com/youtube/v3/search"
            f"?part=snippet&maxResults=10&order=date&type=video&channelId={channel_id}"
            f"&q={quote_plus(search_query)}&key={api_key}"
        )

    with urlopen(api_url, timeout=10) as response:
        payload = json.loads(response.read().decode("utf-8"))

    items = payload.get("items", [])
    for item in items:
        snippet = item.get("snippet", {})
        title = str(snippet.get("title") or "").strip()
        title_lower = title.lower()
        if search_terms and not any(term in title_lower for term in search_terms):
            continue
        if playlist_id:
            video_id = str(item.get("snippet", {}).get("resourceId", {}).get("videoId") or "").strip()
        else:
            video_id = str(item.get("id", {}).get("videoId") or "").strip()
        if not video_id:
            continue
        thumbnails = snippet.get("thumbnails", {})
        thumbnail_url = (
            thumbnails.get("high", {}).get("url")
            or thumbnails.get("medium", {}).get("url")
            or thumbnails.get("default", {}).get("url")
            or f"https://i.ytimg.com/vi/{video_id}/hqdefault.jpg"
        )
        return {
            "episode": content["upcoming_preview"].get("episode"),
            "release_date": content["upcoming_preview"].get("release_date"),
            "headline": content["upcoming_preview"].get("headline"),
            "title": title or content["upcoming_preview"].get("title"),
            "summary": content["upcoming_preview"].get("summary"),
            "source_label": content["upcoming_preview"].get("source_label") or "Official YouTube teaser",
            "source_url": f"https://www.youtube.com/watch?v={video_id}",
            "video_id": video_id,
            "thumbnail_url": thumbnail_url
        }
    return None


def preview_payload(content, settings):
    fallback = normalize_preview(content["upcoming_preview"], "fallback", "manual")
    feed = content.get("preview_feed", {})
    mode = str(feed.get("mode") or "manual").strip()
    if mode != "youtube_api":
        settings["preview_status"] = "manual"
        return fallback

    cached = settings.get("preview_cache")
    if isinstance(cached, dict) and preview_cache_is_fresh(settings):
        settings["preview_status"] = "youtube_api_cached"
        return normalize_preview(cached, "live", "youtube_api")

    try:
        fetched = fetch_youtube_api_preview(content)
    except Exception:
        fetched = None

    if fetched:
        settings["preview_cache"] = fetched
        settings["preview_checked_at"] = datetime.utcnow().isoformat() + "Z"
        settings["preview_status"] = "youtube_api_live"
        save_settings(settings)
        return normalize_preview(fetched, "live", "youtube_api")

    settings["preview_status"] = "manual_fallback"
    return fallback


def build_home_context():
    content = load_content()
    settings = load_settings()
    comments = load_comments()
    reports = load_reports()
    engagement = load_engagement(content)
    images = available_images()
    random.shuffle(images)
    preferred_hero = content["hero"].get("preferred_image", "")
    hero_image = resolve_preferred_image(images, preferred_hero) or (images[0] if images else None)
    gallery_images = [image for image in images if image != hero_image]
    gallery_items = build_gallery_items(gallery_images, load_gallery_metadata())
    featured_comment = choose_featured_comment(comments, settings)
    report_counts = {}
    for report in reports:
        report_counts[report["comment_id"]] = report_counts.get(report["comment_id"], 0) + 1
    top_reaction = top_key(engagement["reactions"])
    top_poll = top_key(engagement["poll"])
    return {
        "content": content,
        "settings": settings,
        "comments": comments,
        "featured_comment": featured_comment,
        "hero_image": hero_image,
        "gallery_items": gallery_items,
        "pending_comment_count": sum(1 for comment in comments if not comment["approved"]),
        "report_counts": report_counts,
        "reactions": engagement["reactions"],
        "reaction_labels": content["reactions"],
        "poll": engagement["poll"],
        "poll_labels": content["poll_options"],
        "top_reaction_key": top_reaction,
        "top_reaction_label": content["reactions"].get(top_reaction),
        "top_poll_key": top_poll,
        "top_poll_label": content["poll_options"].get(top_poll),
        "preview": preview_payload(content, settings)
    }


@app.route("/", methods=["GET"])
def home():
    context = build_home_context()
    return render_template(
        "index.html",
        hero_copy=context["content"]["hero"],
        hero_image=context["hero_image"],
        featured_comment=context["featured_comment"],
        featured_comment_id=context["featured_comment"]["id"] if context["featured_comment"] else None,
        comments=[comment for comment in context["comments"] if comment["approved"]],
        pending_comment_count=context["pending_comment_count"],
        reactions=context["reactions"],
        reaction_labels=context["reaction_labels"],
        poll=context["poll"],
        poll_labels=context["poll_labels"],
        top_reaction_key=context["top_reaction_key"],
        top_reaction_label=context["top_reaction_label"],
        top_poll_key=context["top_poll_key"],
        top_poll_label=context["top_poll_label"],
        episode_briefs=context["content"]["episode_briefs"],
        upcoming_preview=context["preview"],
        gallery_items=context["gallery_items"],
        is_admin=is_admin(),
        quotes=context["content"]["quotes"],
        mood_tags=context["content"]["mood_tags"],
        playlist_notes=context["content"]["playlist_notes"],
        playlist_tracks=context["content"]["playlist_tracks"]
    )


@app.route("/admin", methods=["GET"])
def admin():
    if not is_admin():
        return redirect(url_for("home"))
    context = build_home_context()
    return render_template(
        "admin.html",
        comments=context["comments"],
        featured_comment_id=context["featured_comment"]["id"] if context["featured_comment"] else None,
        report_counts=context["report_counts"],
        content=context["content"],
        settings=context["settings"],
        preview=context["preview"]
    )


@app.route("/admin/login", methods=["POST"])
def admin_login():
    submitted = request.form.get("admin_code", "", type=str).strip()
    if secrets.compare_digest(submitted, ensure_admin_code()):
        session["is_admin"] = True
    return redirect(url_for("admin"))


@app.route("/admin/logout", methods=["POST"])
def admin_logout():
    session.pop("is_admin", None)
    return redirect(url_for("home"))


@app.route("/admin/content", methods=["POST"])
def update_content():
    if not is_admin():
        return redirect(url_for("home"))
    content = load_content()
    preview = content["upcoming_preview"]
    preview["episode"] = request.form.get("episode", preview.get("episode"), type=int)
    preview["release_date"] = request.form.get("release_date", preview.get("release_date", ""), type=str).strip()
    preview["title"] = request.form.get("title", preview.get("title", ""), type=str).strip()
    preview["summary"] = request.form.get("summary", preview.get("summary", ""), type=str).strip()
    preview["source_label"] = request.form.get("source_label", preview.get("source_label", ""), type=str).strip()
    preview["source_url"] = request.form.get("source_url", preview.get("source_url", ""), type=str).strip()
    preview["video_id"] = request.form.get("video_id", preview.get("video_id", ""), type=str).strip()
    preview["thumbnail_url"] = request.form.get("thumbnail_url", preview.get("thumbnail_url", ""), type=str).strip()
    content["upcoming_preview"] = preview
    feed = content.get("preview_feed", {})
    feed["mode"] = request.form.get("preview_mode", feed.get("mode", "youtube_api"), type=str).strip() or "youtube_api"
    feed["channel_id"] = request.form.get("channel_id", feed.get("channel_id", ""), type=str).strip()
    feed["playlist_id"] = request.form.get("playlist_id", feed.get("playlist_id", ""), type=str).strip()
    feed["search_query"] = request.form.get("search_query", feed.get("search_query", "Duang With You teaser"), type=str).strip()
    raw_terms = request.form.get("search_terms", "", type=str).strip()
    if raw_terms:
        feed["search_terms"] = [part.strip() for part in raw_terms.split(",") if part.strip()]
    content["preview_feed"] = feed
    write_json(CONTENT_PATH, content)
    return redirect(url_for("admin"))


@app.route("/comments", methods=["POST"])
def add_comment():
    honeypot = request.form.get("website", "", type=str).strip()
    if honeypot:
        return redirect(url_for("home"))

    name = request.form.get("name", "", type=str).strip()[:MAX_NAME_LENGTH]
    message = request.form.get("message", "", type=str).strip()[:MAX_MESSAGE_LENGTH]
    if not name or not message:
        return redirect(url_for("home"))
    lowered = message.lower()
    if any(term in lowered for term in BLOCKED_TERMS):
        return redirect(url_for("home"))

    entry = {
        "id": secrets.token_hex(6),
        "name": name,
        "message": message,
        "created_at": now_label(),
        "approved": False
    }
    with LOCK:
        comments = load_comments()
        comments.insert(0, entry)
        save_comments(comments)
    return redirect(url_for("home"))


@app.route("/comments/report", methods=["POST"])
def report_comment():
    comment_id = request.form.get("comment_id", "", type=str).strip()
    if not comment_id:
        return redirect(url_for("home"))
    with LOCK:
        reports = load_reports()
        reports.append({"comment_id": comment_id, "reason": "report", "created_at": now_label()})
        save_reports(reports)
    return redirect(url_for("home") + "#guestbook")


@app.route("/admin/comment", methods=["POST"])
def admin_comment_action():
    if not is_admin():
        return redirect(url_for("home"))
    comment_id = request.form.get("comment_id", "", type=str).strip()
    action = request.form.get("action", "", type=str).strip()
    with LOCK:
        comments = load_comments()
        settings = load_settings()
        updated = []
        for comment in comments:
            if comment["id"] != comment_id:
                updated.append(comment)
                continue
            if action == "delete":
                if settings.get("featured_comment_id") == comment_id:
                    settings["featured_comment_id"] = None
                continue
            if action == "approve":
                comment["approved"] = True
            elif action == "hide":
                comment["approved"] = False
                if settings.get("featured_comment_id") == comment_id:
                    settings["featured_comment_id"] = None
            elif action == "feature" and comment["approved"]:
                settings["featured_comment_id"] = comment_id
            updated.append(comment)
        save_comments(updated)
        save_settings(settings)
    return redirect(url_for("admin"))


@app.route("/react", methods=["POST"])
def add_reaction():
    content = load_content()
    reaction = request.form.get("reaction", "", type=str).strip()
    if reaction not in content["reactions"]:
        return redirect(url_for("home"))
    with LOCK:
        engagement = load_engagement(content)
        engagement["reactions"][reaction] += 1
        save_engagement(engagement)
    return redirect(url_for("home") + "#fanPulse")


@app.route("/vote", methods=["POST"])
def add_vote():
    content = load_content()
    choice = request.form.get("choice", "", type=str).strip()
    if choice not in content["poll_options"]:
        return redirect(url_for("home"))
    with LOCK:
        engagement = load_engagement(content)
        engagement["poll"][choice] += 1
        save_engagement(engagement)
    return redirect(url_for("home") + "#sceneVote")


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=True)
