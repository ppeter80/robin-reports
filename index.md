---
layout: home
title: "Peter's reports"
---

<style>
.post-list { list-style: none; padding: 0; }
.post-list li { margin-bottom: 1.5em; padding-bottom: 1em; border-bottom: 1px solid #eee; }
.post-meta { color: #666; font-size: 0.85em; }
</style>

Recent reports below. Most recent first.

<ul class="post-list">
  {% for post in site.posts %}
    <li>
      <h3><a href="{{ post.url | relative_url }}">{{ post.title }}</a></h3>
      <div class="post-meta">{{ post.date | date: "%Y-%m-%d" }}{% if post.tags %} · {{ post.tags | join: ", " }}{% endif %}</div>
      {% if post.summary %}<p>{{ post.summary }}</p>{% endif %}
    </li>
  {% endfor %}
</ul>

{% if site.posts.size == 0 %}
<p><em>No reports published yet.</em></p>
{% endif %}
