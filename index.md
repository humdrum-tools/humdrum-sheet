---
permalink: /index.html
---

{% include_relative scripts-local.html %}

<p>

The following Javascript code is a 
<a target="_blank" href="https://developers.google.com/apps-script/reference/spreadsheet">Google
Apps Script</a> that can be
added to a Google spreadsheet to exchange Humdrum data between <a
target="_blank" href="https://sheets.google.com">Google Sheets</a>
and <a target="_blank" href="https://verovio.humdrum.org">Verovio
Humdrum Viewer</a>.  See the <a target="_blank"
href="https://doc.verovio.humdrum.org/interface/toolbar/spreadsheet">VHV
documentation page</a> about spreadsheet interaction for installation
instructions.

</p>

<div onclick="copyToClipboard('div.language-javascript')" class="button">Copy script to clipboard</div>

```javascript
{% include code/humdrum-sheet.js %}
```

