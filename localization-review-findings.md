# Localization CSV final review findings

Scope: `localization.csv` logical rows 3-2953.

Method: split the CSV into five slices and asked separate AI agents to manually review `Chinese` and `Chinese (Traditional)` against `English`, `Comment`, `zh_TW.po`, `zh_CN.po`, and `usage.html`. This report only lists concrete items worth human review.

Status: completed items are struck through. The fixes have been applied to `localization.csv` while preserving the English placeholder types and counts. The details under each completed item keep the original finding text for review history.

Rows below are logical CSV row numbers, not physical file line numbers.

## Format or concatenation risks

### ~~Row 954 | medium | leading space dropped~~

- English: ` %@ <%@>`
- Chinese: `%1$@ <%2$@>`
- Chinese (Traditional): `%1$@ <%2$@>`
- Problem: English starts with a leading space, but both Chinese columns remove it. If this string is concatenated after another label, the UI text may join incorrectly.
- Suggested fix:
  - Chinese: ` %1$@ <%2$@>`
  - Chinese (Traditional): ` %1$@ <%2$@>`
- Confidence: high

### ~~Row 1262 | low | trailing space dropped in Traditional~~

- English: `Files changed while running command are downloaded back to %@. `
- Chinese: `命令运行期间更改的文件将下载回 %@。 `
- Chinese (Traditional): `指令執行期間變更的檔案將下載回 %@。`
- Problem: English and Simplified keep the trailing space, while Traditional drops it. This looks like a concatenated explanatory sentence.
- Suggested fix:
  - Chinese (Traditional): `指令執行期間變更的檔案將下載回 %@。 `
- Confidence: high

### ~~Row 1789 | medium | trailing space dropped in Traditional~~

- English: `binary `
- Chinese: `二进制 `
- Chinese (Traditional): `二進位`
- Problem: English and Simplified keep a trailing space, likely before a following filename/type phrase. Traditional removes it.
- Suggested fix:
  - Chinese (Traditional): `二進位 `
- Confidence: high

## Placeholder or generated grammar risks

### ~~Row 299 | medium | English `is/are` placeholder may leak into Chinese~~

- English: `%@ been added to Working Copy that %@ not covered by your purchase %d months ago.`
- Comment: first `%@` is feature phrase, second `%@` is `is` or `are`
- Chinese: `%@被添加到 Working Copy，%@不在你 %d 个月前的购买范围内。`
- Chinese (Traditional): `%@新增至 Working Copy，%@不在你 %d 個月前的購買範圍內。`
- Problem: if the second `%@` expands to literal English `is` or `are`, the result becomes broken Chinese like `is不在`.
- Suggested direction: confirm the string composition path. If possible, localize the second placeholder to an empty/neutral value for Chinese, or split into complete localized strings.
- Intended wording:
  - Chinese: `%@ 已添加到 Working Copy，且不在你 %d 个月前的购买范围内。`
  - Chinese (Traditional): `%@ 已新增至 Working Copy，且不在你 %d 個月前的購買範圍內。`
- Confidence: medium

### ~~Row 300 | medium | English `is/are` placeholder may leak into Chinese~~

- English: `%@ been added to Working Copy that %@ not covered by your purchase %d years ago.`
- Comment: first `%@` is feature phrase, second `%@` is `is` or `are`
- Chinese: `%@被添加到 Working Copy，%@不在你 %d 年前的购买范围内。`
- Chinese (Traditional): `%@新增至 Working Copy，%@不在你 %d 年前的購買範圍內。`
- Problem: same as row 299; Chinese does not need the `is/are` placeholder and literal expansion would break the sentence.
- Suggested direction: confirm the string composition path. If possible, localize the second placeholder to an empty/neutral value for Chinese, or split into complete localized strings.
- Intended wording:
  - Chinese: `%@ 已添加到 Working Copy，且不在你 %d 年前的购买范围内。`
  - Chinese (Traditional): `%@ 已新增至 Working Copy，且不在你 %d 年前的購買範圍內。`
- Confidence: medium

## Terminology and locale consistency

### ~~Row 149 | low | Pull Request terminology differs in Simplified~~

- English: `You need to clone repository to view pull request #%d`
- Chinese: `你需要克隆仓库才能查看拉取请求 #%d`
- Chinese (Traditional): `你需要拓製版本庫才能檢視 Pull Request #%d`
- Problem: Simplified uses `拉取请求`, while Traditional and many product UI strings keep `Pull Request`.
- Suggested fix:
  - Chinese: `你需要克隆仓库才能查看 Pull Request #%d`
- Confidence: medium

### ~~Row 883 | low | authentication wording~~

- English: `Authenticating`
- Comment: SSH connection status during user authentication
- Chinese: `正在验证`
- Chinese (Traditional): `正在驗證`
- Problem: `验证/驗證` reads more like verification; SSH login/user authentication is more consistently `认证/認證`.
- Suggested fix:
  - Chinese: `正在认证`
  - Chinese (Traditional): `正在認證`
- Confidence: medium

### ~~Row 1160 | low | Traditional uses mainland-style `新建`~~

- English: `Create new`
- Comment: button to create a file with a different name to avoid overwriting
- Chinese: `新建`
- Chinese (Traditional): `新建`
- Problem: Traditional UI elsewhere tends to use `建立` or `新增`; `新建` is more mainland-style.
- Suggested fix:
  - Chinese (Traditional): `建立新的` or `新增`, depending button context/width
- Confidence: medium

### ~~Row 1494 | low | `refspec` left untranslated~~

- English: `Pick refspec`
- Chinese: `选择 refspec`
- Chinese (Traditional): `選擇 refspec`
- Problem: Git PO references translate `refspec` as `引用规格` / `引用規格`; leaving it untranslated may be inconsistent.
- Suggested fix:
  - Chinese: `选择引用规格`
  - Chinese (Traditional): `選擇引用規格`
- Confidence: high

### ~~Row 1829 | low | Traditional hosting term~~

- English: `hosting`
- Comment: short log kind identifier for hosting provider API
- Chinese: `托管`
- Chinese (Traditional): `託管`
- Problem: Traditional app terminology appears to use `代管` for hosting provider contexts.
- Suggested fix:
  - Chinese (Traditional): `代管`
- Confidence: medium

### ~~Row 2144 | low | Traditional implementation term~~

- English: `Missing implementation for createRepository:private:callback:`
- Chinese: `缺少 createRepository:private:callback: 的实现`
- Chinese (Traditional): `缺少 createRepository:private:callback: 的實現`
- Problem: In Traditional/Taiwan computing UI, `實作` is usually better than `實現` for software implementation.
- Suggested fix:
  - Chinese (Traditional): `缺少 createRepository:private:callback: 的實作`
- Confidence: medium

### ~~Row 2294 | medium | AI token usage translated as auth token~~

- English: `Token Usage`
- Comment: menu label for viewing AI token usage statistics in Repository Agent
- Chinese: `令牌用量`
- Chinese (Traditional): `權杖用量`
- Problem: This is AI token usage, not authentication/access token usage. `令牌` / `權杖` strongly suggests auth tokens.
- Suggested fix:
  - Chinese: `Token 用量`
  - Chinese (Traditional): `Token 用量`
- Confidence: high

### ~~Row 2712 | low | Traditional diff chunk term~~

- English: `Chunks to the left end up in the early commit and chunks to the right in the later. Centered chunks are pending your decision.`
- Chinese: `左边的块将进入较早的提交，右边的块将进入较晚的提交。居中的块等待你决定。`
- Chinese (Traditional): `左邊的塊將進入較早的提交，右邊的塊將進入較晚的提交。居中的塊等待你決定。`
- Problem: Traditional Git references commonly use `區塊` for diff hunks/chunks; `塊` is less idiomatic here.
- Suggested fix:
  - Chinese (Traditional): `左邊的區塊將進入較早的提交，右邊的區塊將進入較晚的提交。居中的區塊等待你決定。`
- Confidence: medium

### ~~Row 2727 | low | Traditional diff chunk term~~

- English: `Drag chunks to the left to put in early commit and right for later commit. Chunks in the middle are undecided.`
- Chinese: `将块拖到左侧放入早期提交，拖到右侧放入后期提交。中间的块尚未决定。`
- Chinese (Traditional): `將塊拖到左側放入早期提交，拖到右側放入後期提交。中間的塊尚未決定。`
- Problem: same as row 2712; `區塊` is more consistent for Git diff chunks.
- Suggested fix:
  - Chinese (Traditional): `將區塊拖到左側放入早期提交，拖到右側放入後期提交。中間的區塊尚未決定。`
- Confidence: medium

## Fluency or meaning

### ~~Row 277 | low | Traditional wording for URL availability~~

- English: `Available at %@`
- Comment: WebDAV server status, `%@` is the URL where server is accessible
- Chinese: `可通过 %@ 访问`
- Chinese (Traditional): `可在 %@ 使用`
- Problem: Traditional is understandable, but for a URL it is less direct than "accessible through".
- Suggested fix:
  - Chinese (Traditional): `可透過 %@ 存取`
- Confidence: high

### ~~Row 743 | low | awkward conditional phrasing~~

- English: `Unable to clone %@ without remote.`
- Chinese: `没有远程无法克隆 %@。`
- Chinese (Traditional): `沒有遠端無法拓製 %@。`
- Problem: sentence is understandable but reads like two clauses without a condition marker.
- Suggested fix:
  - Chinese: `没有远程时无法克隆 %@。`
  - Chinese (Traditional): `沒有遠端時無法拓製 %@。`
- Confidence: high

### ~~Row 744 | low | awkward word order~~

- English: `Unable to commit until all conflicts in repository are resolved.`
- Chinese: `在仓库中所有冲突解决之前无法提交。`
- Chinese (Traditional): `在版本庫中所有衝突解決之前無法提交。`
- Problem: current word order is stiff; "must resolve conflicts first before committing" is more natural.
- Suggested fix:
  - Chinese: `必须先解决仓库中的所有冲突，才能提交。`
  - Chinese (Traditional): `必須先解決版本庫中的所有衝突，才能提交。`
- Confidence: high

### ~~Row 1506 | low | unnatural action label~~

- English: `Prepend to existing file`
- Chinese: `前置到现有文件`
- Chinese (Traditional): `前置到現有檔案`
- Problem: `前置到` is unnatural as a UI action. The meaning is to add content before current file contents.
- Suggested fix:
  - Chinese: `添加到现有文件开头`
  - Chinese (Traditional): `加入現有檔案開頭`
- Confidence: medium

### ~~Row 1624 | low | action label reads like noun phrase~~

- English: `Sign Text`
- Comment: button to create SSH signature of text
- Chinese: `签名文本`
- Chinese (Traditional): `簽名文字`
- Problem: current wording can read as "signature text" rather than "sign this text".
- Suggested fix:
  - Chinese: `为文本签名`
  - Chinese (Traditional): `為文字簽名`
- Confidence: medium

### ~~Row 1641 | low | `capitalization` meaning incomplete~~

- English: `Spellcheck and capitalization`
- Comment: subtitle describing the Natural editing style
- Chinese: `拼写检查和大写`
- Chinese (Traditional): `拼寫檢查和大寫`
- Problem: `大写` / `大寫` alone is vague; the context is likely automatic capitalization behavior.
- Suggested fix:
  - Chinese: `拼写检查和自动大写`
  - Chinese (Traditional): `拼寫檢查和自動大寫`
- Confidence: medium

### ~~Row 2090 | low | awkward fetch result word order~~

- English: `Fetch received %@ for %@.`
- Comment: args are transfer size and repository name
- Chinese: `获取收到了 %2$@ 的 %1$@。`
- Chinese (Traditional): `抓取收到了 %2$@ 的 %1$@。`
- Problem: word order is awkward for a fetch result summary.
- Suggested fix:
  - Chinese: `获取 %2$@ 时收到了 %1$@。`
  - Chinese (Traditional): `抓取 %2$@ 時收到了 %1$@。`
- Confidence: medium

### ~~Row 2091 | low | awkward fetch result word order~~

- English: `Fetch received %@ for %d repositories.`
- Comment: args are transfer size and number of repositories
- Chinese: `获取收到了 %2$d 个仓库的 %1$@。`
- Chinese (Traditional): `抓取收到了 %2$d 個版本庫的 %1$@。`
- Problem: same word order issue as row 2090.
- Suggested fix:
  - Chinese: `获取 %2$d 个仓库时收到了 %1$@。`
  - Chinese (Traditional): `抓取 %2$d 個版本庫時收到了 %1$@。`
- Confidence: medium

### ~~Row 2307 | low | unnatural `access for listing`~~

- English: `Unable to coordinate access to %@ for listing.`
- Comment: file coordination error, `%@` is the directory path
- Chinese: `无法协调对 %@ 的列表访问。`
- Chinese (Traditional): `無法協調對 %@ 的清單存取。`
- Problem: `列表访问` / `清單存取` reads like an unnatural noun phrase.
- Suggested fix:
  - Chinese: `无法协调对 %@ 的访问以列出内容。`
  - Chinese (Traditional): `無法協調對 %@ 的存取以列出內容。`
- Confidence: medium

### ~~Row 2740 | low | incomplete `line` wording~~

- English: `Jump to line`
- Comment: alert message prompting user to enter a line number
- Chinese: `跳转到行`
- Chinese (Traditional): `跳轉到行`
- Problem: Chinese reads incomplete; the prompt asks for a line number.
- Suggested fix:
  - Chinese: `跳转到行号`
  - Chinese (Traditional): `跳轉到行號`
- Confidence: high
