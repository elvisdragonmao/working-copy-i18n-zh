# Localization Review Findings

Reviewed `localization.csv` records 1-2951 in six AI review ranges:

- Records 1-500
- Records 501-1000
- Records 1001-1500
- Records 1501-2000
- Records 2001-2500
- Records 2501-2951

References used for style checks: `zh_CN.po`, `zh_TW.po`, and `usage.html`.

Notes:

- Record numbers below are CSV data-record numbers, starting after the title row and header row. They are not physical file line numbers.
- `localization.csv` has been updated for the agreed findings.
- Completed items are crossed out with `~~...~~`.
- Positional placeholders such as `%1$@` were treated as valid format reordering unless the translation makes the inserted value read incorrectly.
- `Document`/`文件` and `Document Package`/`文件套件` were not flagged because `usage.html` supports this wording for document-oriented iOS terms.

## Higher Confidence Issues

### Format, Meaning, Or Placeholder Problems

- ~~Records 297 and 298, `%@ been added to Working Copy that %@ not covered by your purchase %d months/years ago.`~~
  - Previous zh-CN: `%1$@添加到 Working Copy，但 %2$@ 不在你 %3$d 个月/年前的购买范围内。`
  - Previous zh-TW: `%1$@新增至 Working Copy，但 %2$@ 不在你 %3$d 個月/年前的購買範圍內。`
  - Issue: `%2$@` is documented as `is` or `are`, so the UI may show English grammar inside Chinese.
  - Suggested zh-CN if unused format arguments are allowed: `%1$@添加到 Working Copy，但不在你 %3$d 个月/年前的购买范围内。`
  - Suggested zh-TW if unused format arguments are allowed: `%1$@新增至 Working Copy，但不在你 %3$d 個月/年前的購買範圍內。`
  - Needs implementation decision if placeholder parity is enforced.

- ~~Record 532, `Unable to push changes, that could not be fast-forwarded. Tap to %@ changes from %@ and retry push.`~~
  - Previous zh-CN: `无法推送，因为这些更改无法快进。轻触以处理来自 %2$@ 的更改（%1$@），然后重试推送。`
  - Previous zh-TW: `無法推送，因為這些變更無法快轉。點一下以處理來自 %2$@ 的變更（%1$@），然後重試推送。`
  - Issue: `%1$@` is `merge in` or `rebase onto`; putting it in parentheses makes the required action unclear.
  - Suggested zh-CN: `无法推送，因为这些更改无法快进。轻触以对来自 %2$@ 的更改执行 %1$@，然后重试推送。`
  - Suggested zh-TW: `無法推送，因為這些變更無法快轉。點一下以對來自 %2$@ 的變更執行 %1$@，然後重試推送。`

- ~~Records 721 and 722, `Resolved non-conflicted file(s) %@`~~
  - Previous zh-CN: `已解决无冲突文件 %@`
  - Previous zh-TW: `已解決無衝突檔案 %@`
  - Issue: `已解决无冲突文件` / `已解決無衝突檔案` reads contradictory or unclear.
  - Suggested zh-CN: `已将非冲突文件 %@ 标记为已解决`
  - Suggested zh-TW: `已將非衝突檔案 %@ 標記為已解決`

- ~~Record 2261, `Staging %@ with all zero bytes is almost certainly not intended.`~~
  - Previous zh-CN: `暂存全为零字节的 %@ 几乎可以肯定不是你的本意。`
  - Previous zh-TW: `暫存全為零位元組的 %@ 幾乎可以肯定不是你的本意。`
  - Issue: The current wording can imply `%@` itself is all zero bytes, rather than the staged file content.
  - Suggested zh-CN: `将 %@ 暂存为全零字节几乎可以肯定不是你的本意。`
  - Suggested zh-TW: `將 %@ 暫存為全零位元組幾乎可以肯定不是你的本意。`

- ~~Record 2889, `Synchronizing %@ with %@ %@ ago.`~~
  - Previous zh-CN: `正在同步 %@ 与 %@，上次于 %@ 前。`
  - Previous zh-TW: `正在同步 %@ 與 %@，上次於 %@ 前。`
  - Issue: `上次` makes this sound like a previous sync, but the string is current progress. Record 2890 uses `刚刚开始` / `剛剛開始`.
  - Suggested zh-CN: `正在同步 %@ 与 %@，%@ 前开始。`
  - Suggested zh-TW: `正在同步 %@ 與 %@，%@ 前開始。`

- ~~Record 2933, `%@ has been copied to clipboard with your secret URL Callbacks Key filled out...`~~
  - Previous zh-CN: `%@ 已连同你的 URL Callbacks 密钥复制到剪贴板。你应该用剪贴板内容创建一个新脚本，并将其配置为共享扩展快捷指令。`
  - Issue: zh-CN omits `secret` and blurs that the secret key was filled into the copied content.
  - Suggested zh-CN: `%@ 已填入你的秘密 URL Callbacks 密钥并复制到剪贴板。你应该用剪贴板内容创建一个新脚本，并将其配置为共享扩展快捷指令。`
  - zh-TW already includes `秘密`.

### Terminology And Locale Consistency

- ~~Pull Request terminology in zh-CN is inconsistent.~~
  - Previous zh-CN sometimes kept `Pull Request`, but the following records used `拉取请求`: 316, 675, 1876, 2100, 2290, 2312, 2339, 2389, 2396, 2397, 2748, 2811.
  - zh-TW consistently keeps `Pull Request`.
  - Suggested policy decision: If following the current high-level UI style, change these zh-CN strings to use `Pull Request`.
  - Examples:
    - Record 316: `在 Working Copy 中创建 Pull Request。`
    - Record 675: `缺少用于创建 Pull Request 的仓库。`
    - Record 1876: `创建 Pull Request`

- ~~Records 2679, 2705, 2712, and 2717 use lowercase `head`.~~
  - Issue: Elsewhere in this CSV and in the `.po` references, Git `HEAD` is normally uppercase.
  - Suggested fixes:
    - 2679 zh-CN: `%@ HEAD 已成功更改。`
    - 2679 zh-TW: `%@ HEAD 已成功變更。`
    - 2705 zh-CN: `将分支 HEAD 更改到此提交。`
    - 2705 zh-TW: `將分支 HEAD 變更到此提交。`
    - 2712 zh-CN: `提交 %@ 不是当前分支的 HEAD。`
    - 2712 zh-TW: `提交 %@ 不是目前分支的 HEAD。`
    - 2717 zh-CN: `以 %@ 作为 HEAD 提交创建新分支。`
    - 2717 zh-TW: `以 %@ 作為 HEAD 提交建立新分支。`

- ~~Records 2599 and 2600, `Missing implementation for ...`~~
  - Previous zh-TW used `實現`.
  - Issue: Nearby CSV strings and `usage.html` use `實作` for implementation.
  - Suggested zh-TW:
    - 2599: `缺少 connectSSHKey:title:callback: 的實作`
    - 2600: `缺少 disconnectSSHKey:controller:callback: 的實作`

- ~~Records 2417, 2418, and 2419, `added ...`~~
  - Previous zh-TW: `添加了 %ld 個分支`, `添加了 1 個分支`, `添加了註解`
  - Issue: `添加` reads Simplified/China-oriented in this file. Nearby zh-TW UI generally uses `新增`.
  - Suggested zh-TW: `新增了 %ld 個分支`, `新增了 1 個分支`, `新增了註解`

- ~~Records 2144, 2155, 2157, and 2160 have extra spaces around Chinese quotes in zh-CN.~~
  - Previous examples: `分支 “$BRANCH”`, `名称 “%@” 已被使用。`
  - Issue: Inconsistent with nearby Chinese typography and with zh-TW.
  - Suggested zh-CN:
    - 2144: `缺少新创建的分支“$BRANCH”`
    - 2155: `名称“%@”已被使用。`
    - 2157: `没有分支“$BRANCH”`
    - 2160: `没有名为“%@”的分支，且不符合预期的分支 URL 结构`

### UI Clarity And Fluency

- ~~Record 397, `Duplicate`~~
  - Previous zh-CN: `复制`
  - Previous zh-TW: `複製`
  - Issue: Same wording as record 461 `Copy`, so duplicate-file and copy-menu actions may be indistinguishable.
  - Suggested zh-CN: `制作副本` or `创建副本`
  - Suggested zh-TW: `製作副本` or `建立副本`

- ~~Record 862, `⭐ Starred`~~
  - Previous zh-TW: `⭐ 已加星號標記`
  - Issue: Awkward and redundant.
  - Suggested zh-TW: `⭐ 已加星號` or `⭐ 已標星號`

- ~~Records 891 and 892, `Copy In` / `Copy Out`~~
  - Previous zh-CN: `复制入` / `复制出`
  - Previous zh-TW: `複製入` / `複製出`
  - Issue: Calque-like sync direction labels.
  - Suggested zh-CN: `向内复制` / `向外复制`
  - Suggested zh-TW: `向內複製` / `向外複製`

- ~~Record 1009, `Advanced code editor for iOS with ideal document-picker support.`~~
  - Previous zh-CN: `适用于 iOS 的高级代码编辑器，具有理想的文档选择器支持。`
  - Previous zh-TW: `適用於 iOS 的高階程式碼編輯器，具有理想的文件選擇器支援。`
  - Issue: `理想的` is too literal and awkward in marketing/app integration copy.
  - Suggested zh-CN: `适用于 iOS 的高级代码编辑器，提供出色的文档选择器支持。`
  - Suggested zh-TW: `適用於 iOS 的進階程式碼編輯器，提供完善的文件選擇器支援。`

- ~~Record 1048, `Assignees`~~
  - Previous zh-CN: `被分配者`
  - Issue: Awkward/passive for the GitHub concept. zh-TW `受指派者` is fine.
  - Suggested zh-CN: `受指派者` or `指派对象`

- ~~Record 1100, `Clone All`~~
  - Previous zh-CN: `克隆全部`
  - Previous zh-TW: `拓製全部`
  - Issue: Omits the object. The comment says it downloads copies of all repositories.
  - Suggested zh-CN: `克隆所有仓库`
  - Suggested zh-TW: `拓製所有版本庫`

- ~~Record 1338, `Import as New`~~
  - Previous zh-CN: `导入为新项`
  - Previous zh-TW: `匯入為新項`
  - Issue: The comment says this imports as a new repository, not a generic new item.
  - Suggested zh-CN: `导入为新仓库`
  - Suggested zh-TW: `匯入為新版本庫`

- ~~Record 1952, `%@ ends up including centered blocks while blocks outside screen are excluded...`~~
  - Previous zh-TW: `%@ 將包含居中的塊，而螢幕外的塊將被排除。邊緣處的塊等待你決定。`
  - Issue: `居中` and `塊` are understandable, but `置中` and `區塊` are more idiomatic in Taiwan UI and align with `zh_TW.po` Git patch-block style.
  - Suggested zh-TW: `%@ 將包含置中的區塊，而螢幕外的區塊將被排除。邊緣處的區塊等待你決定。`

- ~~Record 1970, `%@got hash %@`~~
  - Previous zh-CN: `%@得到哈希 %@`
  - Previous zh-TW: `%@得到雜湊 %@`
  - Issue: `得到哈希` / `得到雜湊` is awkward as a commit result clause.
  - Suggested zh-CN: `%@获得哈希值 %@`
  - Suggested zh-TW: `%@取得雜湊值 %@`

- ~~Record 2002, `Authenticate to access repositories`~~
  - Previous zh-CN: `验证以访问仓库`
  - Previous zh-TW: `驗證以存取版本庫`
  - Issue: The verb lacks an object and reads awkwardly.
  - Suggested zh-CN: `验证身份以访问仓库`
  - Suggested zh-TW: `驗證身分以存取版本庫`

- ~~Record 2444, `operation unsupported`~~
  - Previous zh-CN: `操作不支持`
  - Previous zh-TW: `操作不支援`
  - Issue: Unnatural word order.
  - Suggested zh-CN: `不支持此操作`
  - Suggested zh-TW: `不支援此操作`

## Needs Human Decision

- ~~Record 517, `Link_identifies_directories_inside_working_copy._Use_x-callback-url/zip_to_convert_to_zip_archive.`~~
  - Previous zh-CN: `链接用于标识 Working Copy 内的目录。使用 x-callback-url/zip 可转换为 ZIP 压缩包。`
  - Previous zh-TW: `連結用於識別 Working Copy 內的目錄。使用 x-callback-url/zip 可轉換為 ZIP 壓縮檔。`
  - Decision applied: Danish and German preserve the underscores from English, so the Chinese was changed to preserve underscore-style formatting too.

- ~~Record 909, `Rebase Pull`~~
  - Previous zh-CN: `变基拉取`
  - Previous zh-TW: `重定基底拉取`
  - Decision applied: `变基式拉取` / `重定基底式拉取` were used as the feature-name style.

- ~~Record 1401, `Markdown Content Blocks`~~
  - Previous zh-CN: `Markdown 内容块`
  - Previous zh-TW: `Markdown 內容塊`
  - Decision applied: zh-TW was changed to `Markdown 內容區塊`.

- ~~Pull Request terminology in zh-CN needs a policy decision.~~
  - This report suggests using `Pull Request` for consistency with zh-TW and many high-level UI strings.
  - If the product intentionally wants localized zh-CN GitHub terms in some contexts, keep `拉取请求` and document where it should appear.

- ~~Records 297 and 298 need implementation confirmation before dropping `%2$@`.~~
  - If the localization runtime safely accepts unused positional arguments, dropping `%2$@` from Chinese is the cleanest translation.
  - If placeholder parity is enforced by tooling, the source format may need a separate localization path.
