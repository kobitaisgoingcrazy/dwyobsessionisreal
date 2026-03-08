from flask import Flask, render_template
import os
import random

app = Flask(__name__)

@app.route("/")
def home():
    img_dir = os.path.join(app.static_folder, "images")
    blocked_keywords = ("dolphin", "whale")

    images = [
        f for f in os.listdir(img_dir)
        if f.lower().endswith((".jpg", ".jpeg", ".png", ".webp", ".jfif", ".avif"))
        and not any(k in f.lower() for k in blocked_keywords)
    ]

    random.shuffle(images)
    return render_template("index.html", images=images)

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=True)
