---
layout: page
title: お知らせ一覧
permalink: /news/
---

<h1>お知らせ</h1>

<p>L-crownに関するリリース情報、アップデート、お知らせなどをまとめています。</p>

<ul class="news-list">
  {% assign sorted_posts = site.posts | sort: 'date' | reverse %}
  {% for post in sorted_posts %}
    {% if post.categories contains 'news' or post.categories contains 'announcement' %}
      <li>
        <time datetime="{{ post.date | date_to_xmlschema }}">{{ post.date | date: "%Y年%m月%d日" }}</time>
        <a href="{{ post.url }}">{{ post.title }}</a>
      </li>
    {% endif %}
  {% endfor %}
</ul>

<style>
  .news-list li {
    margin-bottom: 1em;
    border-bottom: 1px solid #eee;
    padding-bottom: 1em;
  }
  .news-list time {
    display: block;
    color: #666;
    font-size: 0.9em;
  }
</style>
