#!/usr/bin/env python3
import os
import json
import subprocess
import re
from datetime import datetime, timedelta, date
from collections import defaultdict


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


def get_brain_activities(brain_path, conversation_ids, target_date=None):
    activities = []

    for conv_id in conversation_ids:
        conv_path = os.path.join(brain_path, conv_id)
        if not os.path.isdir(conv_path):
            continue

        for root, _, files in os.walk(conv_path):
            for file in files:
                file_path = os.path.join(root, file)
                mtime = os.path.getmtime(file_path)
                ts = datetime.fromtimestamp(mtime).astimezone()

                if target_date and ts.date() != target_date:
                    continue

                activities.append(
                    {
                        "type": "file",
                        "timestamp": ts,
                        "label": f"Activity in {conv_id[:8]}: {file}",
                        "conv_id": conv_id,
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
                                if (
                                    not target_date
                                    or ts_meta.date() == target_date
                                ):
                                    label = f"Log {conv_id[:8]}: {data.get('summary', 'Activity')}"
                                    activities.append(
                                        {
                                            "type": "log",
                                            "timestamp": ts_meta,
                                            "label": label,
                                            "conv_id": conv_id,
                                        }
                                    )
                    except Exception:
                        continue
    return activities


def extract_issue(label):
    match = re.search(r"#(\d+)", label)
    return f"#{match.group(1)}" if match else "Unassigned"


def analyze_grouped_time(activities, idle_threshold_mins=45):
    if not activities:
        return "No activities found."

    # Group activities by issue
    grouped = defaultdict(list)
    for a in activities:
        issue = a.get("attributed_issue") or extract_issue(a["label"])
        grouped[issue].append(a)

    print("\n### Time Analysis Report")
    total_active = timedelta()

    for issue, acts in sorted(grouped.items()):
        acts.sort(key=lambda x: x["timestamp"])
        start = acts[0]["timestamp"]
        end = acts[-1]["timestamp"]
        duration = end - start

        idle_time = timedelta()
        gaps = []
        for i in range(1, len(acts)):
            gap = acts[i]["timestamp"] - acts[i - 1]["timestamp"]
            if gap > timedelta(minutes=idle_threshold_mins):
                idle_time += gap
                gaps.append(
                    (acts[i - 1]["timestamp"], acts[i]["timestamp"], gap)
                )

        active = duration - idle_time
        total_active += active

        print(f"\n#### Issue: {issue}")
        print(f"- **Active Time**: {active}")
        print(
            f"- **Total Span**: {duration} (from {start.strftime('%H:%M')} to {end.strftime('%H:%M')})"
        )
        print(f"- **Idle Time**: {idle_time}")

        if gaps:
            print("  - *Idle Gaps Explanation:*")
            for s, e, d in gaps:
                print(
                    f"    - Gap from {s.strftime('%H:%M')} to {e.strftime('%H:%M')} ({d}) (threshold: {idle_threshold_mins}m)"
                )

    print(f"\n---\n**Total Active Time for All Issues**: **{total_active}**")
    return ""


if __name__ == "__main__":
    import sys
    import argparse

    parser = argparse.ArgumentParser(
        description="Analyze time spent on tasks."
    )
    parser.add_argument(
        "queries", nargs="*", help="Issue numbers or keywords to filter."
    )
    parser.add_argument(
        "--date", help="Specific date to analyze (YYYY-MM-DD)."
    )
    args = parser.parse_args()

    target_date = (
        datetime.strptime(args.date, "%Y-%m-%d").date()
        if args.date
        else date.today()
    )
    brain_path = "/Users/galihpratama/.gemini/antigravity/brain"

    # 1. Collect all potential relevant activities
    all_acts = []

    # Brain activities grouping
    conv_issue_map = {}  # conv_id -> attributed_issue

    # Git commits
    if args.queries:
        for q in args.queries:
            issue_tag = f"#{q}" if q.isdigit() else q
            commits = get_git_commits(q, since=target_date.isoformat())
            for c in commits:
                c["attributed_issue"] = issue_tag
            all_acts.extend(commits)

            # Find conversations for this query
            found_ids = find_relevant_conv_ids(brain_path, q)
            for cid in found_ids:
                conv_issue_map[cid] = issue_tag
    else:
        # If no query, we check all commits for the date
        all_acts.extend(get_git_commits("", since=target_date.isoformat()))

    conv_ids_to_check = (
        list(conv_issue_map.keys()) if args.queries else os.listdir(brain_path)
    )
    brain_acts = get_brain_activities(
        brain_path, conv_ids_to_check, target_date=target_date
    )

    for a in brain_acts:
        if a["conv_id"] in conv_issue_map:
            a["attributed_issue"] = conv_issue_map[a["conv_id"]]

    all_acts.extend(brain_acts)

    # Standardize timezones
    local_tz = datetime.now().astimezone().tzinfo
    for a in all_acts:
        if a["timestamp"].tzinfo:
            a["timestamp"] = a["timestamp"].astimezone(local_tz)
        else:
            a["timestamp"] = a["timestamp"].replace(tzinfo=local_tz)

    # Filter by specific date
    final_acts = [a for a in all_acts if a["timestamp"].date() == target_date]

    # Deduplicate
    unique_acts = []
    seen = set()
    for a in sorted(final_acts, key=lambda x: x["timestamp"]):
        key = (a["timestamp"].replace(microsecond=0), a["label"])
        if key not in seen:
            seen.add(key)
            unique_acts.append(a)

    if not unique_acts:
        print(f"No activities found for {target_date}.")
    else:
        print(f"### Activities for {target_date}")
        analyze_grouped_time(unique_acts)
