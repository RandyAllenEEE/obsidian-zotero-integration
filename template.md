---
{% if creators and creators|length > 0 %}{% set first_author = creators[0] %}first_author: "{{ (first_author.name if first_author.name else (first_author.firstName | default('')) + ' ' + (first_author.lastName | default(''))) | trim }}"{% set printed_other_authors_header = false %}{% for t in creators %}  {% if not loop.first %}    {% set author_name = (t.name if t.name else (t.firstName | default('')) + ' ' + (t.lastName | default(''))) | trim %}    {% if author_name %}      {% if printed_other_authors_header == false %}
other_authors:{% set printed_other_authors_header = true %}      {% endif %}
 - "{{ author_name }}"    {% endif %}  {% endif %}{% endfor %}{% endif %}
{% if tags and tags|length > 0 %}{% set star_char = "⭐" %}{% set status_done = "/done" %}{% set status_unread = "/unread" %}{% set status_reading = "/reading" %}{% set score_tag = none %}{% set status_tag = none %}{% set printed_keywords_header = false %}{% for t in tags %}{% if score_tag == none and t.tag.indexOf(star_char) != -1 %} {% set score_tag = t.tag %}{% elif status_tag == none and (t.tag == status_done or t.tag == status_unread or t.tag == status_reading) %}{% set status_tag = t.tag %}{% elif t.type == 1 %}{% if printed_keywords_header == false %}
keywords:{% set printed_keywords_header = true %}{% endif %}
 - "{{ t.tag }}"    {% endif %}{% endfor %}{% if score_tag %}
score: "{{ score_tag }}"{% endif %}{% if status_tag %}
status: "{{ status_tag }}"{% endif %}{% endif %}
date: "{{ date | format('YYYY') if date else '' }}"
DOI: "{{ DOI if DOI else '' }}"
languages: "{{ language | default('') }}"
type: "{{ (itemType | default('')) }}{{ ' ' + thesisType if thesisType else '' }}"{% if itemType == "journalArticle" %}
journal: "{{ (journalAbbreviation if journalAbbreviation else publicationTitle) | default('') }}"{% elif itemType == "thesis" %}
university: "{{ university | default('') }}"{% elif itemType == "conferencePaper" %}
conference: "{{ publicationTitle | default('') }}"{% elif itemType == "bookSection" %}
book_title: "{{ publicationTitle | default('') }}"{% endif %}
{% if extra %}{% set search_keys = ["Company", "Distributor", "Institution", "Label", "Publisher", "CLC", "major", "remark", "abstractTranslation", "download", "album", "foundation", "original-container-title"] %}{% set display_keys = ["remark", "foundation"] %}{% set delimiter = "|||SPLIT|||" %}{% set temp_extra = extra %}{% for key in search_keys %}{% set key_string = key + ": " %}{% set key_with_space = " " + key_string %}{% set key_with_newline = "\n" + key_string %}{% set temp_extra = temp_extra | replace(key_with_space, delimiter + key_with_space) %}{% set temp_extra = temp_extra | replace(key_with_newline, delimiter + key_with_newline) %}{% endfor %}{% set parts = temp_extra.split(delimiter) %}{% for part in parts %}{% set part = part | trim %}{% set colon_index = part.indexOf(": ") %}{% if colon_index != -1 %}{% set key_name = part.slice(0, colon_index) | trim | lower %}{% set value_content = part.slice(colon_index + 2) | trim %}{% if key_name in display_keys %}{{ key_name }}: "{{ value_content }}"
{% endif %}{% endif %}{% endfor %}{% endif %}
---

# 论文信息
## 链接
- **Url**: [Open online]({{url}})
- **zotero entry**: {{pdfZoteroLink}}
- **open pdf**: [zotero]({{select}})
## 摘要
{{abstractNote}}

# 笔记
{% persist "notes" -%}{% if lastImportDate.valueOf() == 0 %}

## 概要

## 研究对象

## 背景

## 方法

## 结论
{% endif -%}{% endpersist %}

# 标注
## 背景
{% set i=1%}{% for annotation in annotations %}{% if annotation.color == '#ffd400' %}
### 第{{i}}个注释{% set i=i+1 %}
#### 文本:
{{annotation.annotatedText}}
#### 评论:
{{annotation.comment}}{% if annotation.imageBaseName %}
![[{{annotation.imageBaseName}}]]{% endif %}
#### zotero位置:
{{pdfZoteroLink|replace("//select/", "//open-pdf/")|replace(")", "")}}?page={{annotation.page}}&annotation={{annotation.id}})
{% endif %}{% endfor %}
## 重点
{% set i=1%}{% for annotation in annotations %}{% if annotation.color == '#ff6666' %}
### 第{{i}}个注释{% set i=i+1 %}
#### 文本:
{{annotation.annotatedText}}
#### 评论: 
{{annotation.comment}}{% if annotation.imageBaseName %}
![[{{annotation.imageBaseName}}]]{% endif %}
#### zotero位置:
{{pdfZoteroLink|replace("//select/", "//open-pdf/")|replace(")", "")}}?page={{annotation.page}}&annotation={{annotation.id}})
{% endif %}{% endfor %}
## 原理
{% set i=1%}{% for annotation in annotations %}{% if annotation.color == '#5fb236' %}
### 第{{i}}个注释{% set i=i+1 %}
#### 文本:
{{annotation.annotatedText}}
#### 评论: 
{{annotation.comment}}{% if annotation.imageBaseName %}
![[{{annotation.imageBaseName}}]]{% endif %}
#### zotero位置:
{{pdfZoteroLink|replace("//select/", "//open-pdf/")|replace(")", "")}}?page={{annotation.page}}&annotation={{annotation.id}})
{% endif %}{% endfor %}
## 应用
{% set i=1%}{% for annotation in annotations %}{% if annotation.color == '#2ea8e5' %}
### 第{{i}}个注释{% set i=i+1 %}
#### 文本:
{{annotation.annotatedText}}
#### 评论: 
{{annotation.comment}}{% if annotation.imageBaseName %}
![[{{annotation.imageBaseName}}]]{% endif %}
#### zotero位置:
{{pdfZoteroLink|replace("//select/", "//open-pdf/")|replace(")", "")}}?page={{annotation.page}}&annotation={{annotation.id}})
{% endif %}{% endfor %}
## 特性
{% set i=1%}{% for annotation in annotations %}{% if annotation.color == '#a28ae5' %}
### 第{{i}}个注释{% set i=i+1 %}
#### 文本:
{{annotation.annotatedText}}
#### 评论: 
{{annotation.comment}}{% if annotation.imageBaseName %}
![[{{annotation.imageBaseName}}]]{% endif %}
#### zotero位置:
{{pdfZoteroLink|replace("//select/", "//open-pdf/")|replace(")", "")}}?page={{annotation.page}}&annotation={{annotation.id}})
{% endif %}{% endfor %}
## 疑惑
{% set i=1%}{% for annotation in annotations %}{% if annotation.color == '#e56eee' %}
### 第{{i}}个注释{% set i=i+1 %}
#### 文本:
{{annotation.annotatedText}}
#### 评论: 
{{annotation.comment}}{% if annotation.imageBaseName %}
![[{{annotation.imageBaseName}}]]{% endif %}
#### zotero位置:
{{pdfZoteroLink|replace("//select/", "//open-pdf/")|replace(")", "")}}?page={{annotation.page}}&annotation={{annotation.id}})
{% endif %}{% endfor %}
## 方法
{% set i=1%}{% for annotation in annotations %}{% if annotation.color == '#f19837' %}
### 第{{i}}个注释{% set i=i+1 %}
#### 文本:
{{annotation.annotatedText}}
#### 评论: 
{{annotation.comment}}{% if annotation.imageBaseName %}
![[{{annotation.imageBaseName}}]]{% endif %}
#### zotero位置:
{{pdfZoteroLink|replace("//select/", "//open-pdf/")|replace(")", "")}}?page={{annotation.page}}&annotation={{annotation.id}})
{% endif %}{% endfor %}
## 参数
{% set i=1%}{% for annotation in annotations %}{% if annotation.color == '#aaaaaa' %}
### 第{{i}}个注释{% set i=i+1 %}
#### 文本:
{{annotation.annotatedText}}
#### 评论: 
{{annotation.comment}}{% if annotation.imageBaseName %}
![[{{annotation.imageBaseName}}]]{% endif %}
#### zotero位置:
{{pdfZoteroLink|replace("//select/", "//open-pdf/")|replace(")", "")}}?page={{annotation.page}}&annotation={{annotation.id}})
{% endif %}{% endfor %}

# 导入记录
{% persist "annotations" -%}
{% set newAnnotations = annotations | filterby("date", "dateafter", lastImportDate) -%}
{% if newAnnotations.length > 0 %}
## Imported: {{importDate | format("YYYY-MM-DD h:mm a")}}

{% for a in newAnnotations %}
> {{a.annotatedText}}
{% endfor %}

{% endif -%}
{% endpersist %}
