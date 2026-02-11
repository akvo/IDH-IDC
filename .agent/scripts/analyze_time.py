#!/usr/bin/env python3
import os
import json
import subprocess
from datetime import datetime, timedelta, date


def get_git_commits(query, since="today"):
    since_arg = "midnight" if since == "today" else since
    try:
        cmd = [
            "git",
            "log",
            "--grep=" + query,
            "--since=" + since_arg,
            "--pretty=format:%h|%aI|%s",
        ]
        result = subprocess.run(
            cmd, capture_output=True, text=True, check=True
        )
        commits = []
        for line in result.stdout.splitlines():
            if line:
                parts = line.split("|")
                commits.append(
                    {
                        "type": "commit",
                        "timestamp": datetime.fromisoformat(parts[1]),
                        "label": f"Commit {parts[0]}: {parts[2]}",
                    }
                )
        return commits
    except subprocess.CalledProcessError:
        return []


def find_relevant_conv_ids(brain_path, query):
    relevant = set()
    for conv_id in os.listdir(brain_path):
        conv_path = os.path.join(brain_path, conv_id)
        if not os.path.isdir(conv_path):
            continue

        # Search logs for query
        for root, _, files in os.walk(conv_path):
            for file in files:
                if file.endswith(".md"):
                    try:
                        with open(os.path.join(root, file), "r") as f:
                            if query.lower() in f.read().lower():
                                relevant.add(conv_id)
                                break
                    except Exception:
                        continue
            if conv_id in relevant:
                break
    return list(relevant)


def get_brain_activities(brain_path, conversation_ids, only_today=True):
    activities = []
    today = date.today()

    for conv_id in conversation_ids:
        conv_path = os.path.join(brain_path, conv_id)
        if not os.path.isdir(conv_path):
            continue

        for root, _, files in os.walk(conv_path):
            for file in files:
                file_path = os.path.join(root, file)
                mtime = os.path.getmtime(file_path)
                ts = datetime.fromtimestamp(mtime).astimezone()

                if only_today and ts.date() != today:
                    continue

                activities.append(
                    {
                        "type": "file",
                        "timestamp": ts,
                        "label": f"Activity in {conv_id[:8]}: {file}",
                    }
                )

                if file.endswith("metadata.json"):
                    try:
                        with open(file_path, "r") as f:
                            data = json.load(f)
                            ts_str = data.get("updatedAt") or data.get(
                                "timestamp"
                            )
                            if ts_str:
                                ts_str = ts_str.replace("Z", "+00:00")
                                ts_meta = datetime.fromisoformat(ts_str)
                                if not only_today or ts_meta.date() == today:
                                    label = f"Log {conv_id[:8]}: {data.get('summary', 'Activity')}"
                                    activities.append(
                                        {
                                            "type": "log",
                                            "timestamp": ts_meta,
                                            "label": label,
                                        }
                                    )
                    except Exception:
                        continue
    return activities


def analyze_time(activities, idle_threshold_mins=45):
    if not activities:
        return "No activities found for today."

    activities.sort(key=lambda x: x["timestamp"])

    start_time = activities[0]["timestamp"]
    end_time = activities[-1]["timestamp"]

    total_duration = end_time - start_time
    idle_time = timedelta()
    gaps = []

    for i in range(1, len(activities)):
        gap = activities[i]["timestamp"] - activities[i - 1]["timestamp"]
        if gap > timedelta(minutes=idle_threshold_mins):
            idle_time += gap
            gaps.append(
                {
                    "start": activities[i - 1]["timestamp"],
                    "end": activities[i]["timestamp"],
                    "duration": gap,
                }
            )

    active_time = total_duration - idle_time

    # Format and print report
    print("### Time Analysis for Today")
    print(f"- **Total Duration**: {total_duration}")
    print(f"- **Idle Gaps**: {idle_time}")
    print(f"- **Active Time**: **{active_time}**")

    if gaps:
        print("\n#### Idle Gaps Detail:")
        for gap in gaps:
            start_str = gap["start"].strftime("%H:%M")
            end_str = gap["end"].strftime("%H:%M")
            print(f"- {start_str} to {end_str} ({gap['duration']})")
    return ""


if __name__ == "__main__":
    import sys

    query = sys.argv[1] if len(sys.argv) > 1 else ""
    if not query:
        print("Usage: analyze_time.py <issue_number_or_keyword>")
        sys.exit(1)

    brain_path = "/Users/galihpratama/.gemini/antigravity/brain"

    # 1. Get relevant conversations by searching logs
    conv_ids = find_relevant_conv_ids(brain_path, query)

    # 2. Get activities from those conversations (only for today)
    brain_acts = get_brain_activities(brain_path, conv_ids, only_today=True)

    # 3. Get git commits (only for today)
    commits = get_git_commits(query, since="today")

    all_activities = commits + brain_acts

    # 4. Standardize timestamps
    for a in all_activities:
        if a["timestamp"].tzinfo is None:
            a["timestamp"] = a["timestamp"].replace(
                tzinfo=datetime.now().astimezone().tzinfo
            )

    # 5. Deduplicate and analyze
    unique_activities = []
    seen = set()
    for a in sorted(all_activities, key=lambda x: x["timestamp"]):
        ts_key = a["timestamp"].replace(microsecond=0)
        if ts_key not in seen:
            seen.add(ts_key)
            unique_activities.append(a)

    analyze_time(unique_activities)
