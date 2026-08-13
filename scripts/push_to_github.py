#!/usr/bin/env python3
"""通过GitHub API推送整个项目到GitHub"""
import requests
import os
import json
import base64
import mimetypes

TOKEN = "YOUR_GITHUB_TOKEN"  # 请替换为你的GitHub Personal Access Token
REPO = "songzhaoxi/szxfuyin.com"
BRANCH = "main"
WORKSPACE = "/data/user/0/com.ai.assistance.operit/files/workspace/457b0d3f-edd5-4d18-8710-9d084c55f827"

HEADERS = {
    "Authorization": f"Bearer {TOKEN}",
    "Accept": "application/vnd.github.v3+json"
}

# 需要排除的目录和文件（对应.gitignore）
EXCLUDE_DIRS = {
    'node_modules', '.git', '.backup', 
    '.gradle', 'build', 'target', 'out', 'bin',
    '.idea', '.vscode', '.settings', '.metadata',
    'nbproject', 'nbbuild', 'dist', 'nbdist', '.mvn'
}
EXCLUDE_EXTS = {'.class', '.log', '.war', '.nar', '.ear', '.zip', '.tar.gz', '.rar', 
                '.iml', '.iws', '.ipr', '.DS_Store', '.tmp', '.temp', '.bak'}
EXCLUDE_FILES = {'.env', 'Thumbs.db', 'Desktop.ini', 'mvnw', 'mvnw.cmd'}

def should_include(path):
    """检查文件是否应该被包含在推送中"""
    rel_path = os.path.relpath(path, WORKSPACE)
    parts = rel_path.split(os.sep)
    
    # 检查是否在排除目录中
    for part in parts[:-1]:
        if part in EXCLUDE_DIRS:
            return False
    
    # 检查文件名
    filename = parts[-1]
    if filename in EXCLUDE_FILES:
        return False
    
    # 检查扩展名
    _, ext = os.path.splitext(filename)
    if ext in EXCLUDE_EXTS:
        return False
    
    return True

def get_latest_commit():
    """获取最新commit SHA"""
    url = f"https://api.github.com/repos/{REPO}/git/refs/heads/{BRANCH}"
    resp = requests.get(url, headers=HEADERS)
    resp.raise_for_status()
    data = resp.json()
    return data['object']['sha']

def create_blob(file_path):
    """创建blob对象"""
    with open(file_path, 'rb') as f:
        content = f.read()
    
    # 判断是否为文本文件
    is_text = True
    try:
        content.decode('utf-8')
    except:
        is_text = False
    
    if is_text:
        data = {"content": content.decode('utf-8'), "encoding": "utf-8"}
    else:
        data = {"content": base64.b64encode(content).decode('ascii'), "encoding": "base64"}
    
    url = f"https://api.github.com/repos/{REPO}/git/blobs"
    resp = requests.post(url, headers=HEADERS, json=data)
    resp.raise_for_status()
    return resp.json()['sha']

def get_current_tree_sha(commit_sha):
    """获取当前commit的tree SHA"""
    url = f"https://api.github.com/repos/{REPO}/git/commits/{commit_sha}"
    resp = requests.get(url, headers=HEADERS)
    resp.raise_for_status()
    return resp.json()['tree']['sha']

def create_tree(base_tree_sha, blobs):
    """创建新的tree"""
    url = f"https://api.github.com/repos/{REPO}/git/trees"
    data = {
        "base_tree": base_tree_sha,
        "tree": blobs
    }
    resp = requests.post(url, headers=HEADERS, json=data)
    resp.raise_for_status()
    return resp.json()['sha']

def create_commit(tree_sha, parent_sha, message):
    """创建commit"""
    url = f"https://api.github.com/repos/{REPO}/git/commits"
    data = {
        "message": message,
        "tree": tree_sha,
        "parents": [parent_sha]
    }
    resp = requests.post(url, headers=HEADERS, json=data)
    resp.raise_for_status()
    return resp.json()['sha']

def update_ref(commit_sha):
    """更新分支引用"""
    url = f"https://api.github.com/repos/{REPO}/git/refs/heads/{BRANCH}"
    data = {"sha": commit_sha, "force": True}
    resp = requests.patch(url, headers=HEADERS, json=data)
    resp.raise_for_status()
    return resp.json()['object']['sha']

def main():
    print("🚀 开始通过API推送代码到GitHub...")
    
    # 获取最新commit
    print("📦 获取最新commit...")
    latest_commit = get_latest_commit()
    print(f"   最新commit: {latest_commit}")
    
    # 获取当前tree
    base_tree_sha = get_current_tree_sha(latest_commit)
    print(f"🌳 当前tree: {base_tree_sha}")
    
    # 收集所有文件
    blob_entries = []
    total_size = 0
    file_count = 0
    
    for root, dirs, files in os.walk(WORKSPACE):
        # 过滤排除目录
        rel_root = os.path.relpath(root, WORKSPACE)
        if rel_root == '.':
            dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS]
        else:
            parts = rel_root.split(os.sep)
            if any(p in EXCLUDE_DIRS for p in parts):
                dirs.clear()
                continue
        
        for filename in files:
            filepath = os.path.join(root, filename)
            if not should_include(filepath):
                continue
            
            rel_path = os.path.relpath(filepath, WORKSPACE)
            size = os.path.getsize(filepath)
            total_size += size
            file_count += 1
            
            print(f"  📄 {rel_path} ({size/1024:.1f}KB)")
            
            # 创建blob
            blob_sha = create_blob(filepath)
            
            blob_entries.append({
                "path": rel_path,
                "mode": "100644",
                "type": "blob",
                "sha": blob_sha
            })
    
    print(f"\n📊 共{file_count}个文件，总大小{total_size/1024/1024:.1f}MB")
    
    # 分批创建tree（GitHub API每次最多100个条目）
    batch_size = 80
    all_tree_sha = base_tree_sha
    
    for i in range(0, len(blob_entries), batch_size):
        batch = blob_entries[i:i+batch_size]
        print(f"📦 创建tree批次 {i//batch_size + 1}/{(len(blob_entries)-1)//batch_size + 1}...")
        all_tree_sha = create_tree(all_tree_sha, batch)
        print(f"   ✅ tree SHA: {all_tree_sha}")
    
    # 创建commit
    print("💾 创建commit...")
    commit_message = "福音传播爱 - 完整全栈系统搭建（含前后端+管理后台+70+全球福音视频）"
    new_commit = create_commit(all_tree_sha, latest_commit, commit_message)
    print(f"   ✅ commit: {new_commit}")
    
    # 更新ref
    print("📤 推送到GitHub...")
    result = update_ref(new_commit)
    print(f"   ✅ 推送成功！ref: {result}")
    
    print("\n🎉 全部完成！代码已推送到:")
    print(f"   https://github.com/{REPO}")

if __name__ == "__main__":
    main()
