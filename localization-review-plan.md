# Localization review fix plan

This checklist records the planned fixes before applying them to
`localization.csv`. It is based on the chunked AI review of lines 1-4302.

Status:

- [x] Apply high-confidence fixes to `localization.csv`.
- [x] Preserve existing CSV structure and multiline fields.
- [x] Re-run `pnpm validate` after edits.
- [ ] Rebuild review UI if needed.

## Batch terminology rules

- [x] Standardize `Pro unlock` in Chinese as `专业版解锁`; Traditional as `專業版解鎖`.
- [x] Standardize `Sign out` in Traditional as `登出`, not `退出登入`.
- [x] Standardize `Callback` in Traditional as `回呼`, not `回撥`.
- [x] Standardize HTTP `header` as `标头` / `標頭`.
- [x] Standardize Traditional `socket` as `通訊端`, not `套接字`.
- [x] Standardize Traditional `Keychain` as `鑰匙圈`, not `鑰匙串`.
- [x] Standardize `pathspec/path specification` as `路径规格` / `路徑規格`.
- [x] Standardize Traditional `syntax highlighting` as `語法突顯`.
- [x] Standardize document package as `文档包` / `文件套件`.
- [x] Standardize generic `item/items` as `项目` / `項目`, not Traditional `專案`.
- [x] Standardize archive wording in Traditional as `壓縮檔` and `解壓縮`.
- [x] Standardize `Assignee(s)` as `被分配者` / `受指派者`.
- [x] Preserve source-required trailing ASCII spaces in translated strings.
- [x] Fix Traditional `提交併` to `提交並` when it is the conjunction "and".

## Line-by-line checklist

### 1-200

- [x] 26, Chinese and Traditional: `Pro 功能已解锁/解鎖` -> `专业版功能已解锁` / `專業版功能已解鎖`.
- [x] 51, Traditional: `無限版本庫` -> `不限數量的版本庫`.
- [x] 144, Chinese: `Pro 解锁` -> `专业版解锁`; `无限数量的仓库` -> `不限数量的仓库`.
- [x] 182, Chinese and Traditional: `偶尔/偶爾的通知` -> `不定期公告`.
- [x] 199, Chinese and Traditional: `打赏/贊助、支持/支援和社群` -> `提示、支持和社区` / `提示、支援與社群`.

### 201-400

- [x] 224, Chinese: fix `App的` spacing and use `Playgrounds App`.
- [x] 279, Traditional: second `certificate` should be `憑證`, not `證書`.
- [x] 303, Chinese and Traditional: `分离/分離的 HEAD` -> Git status wording, `分离头指针` / `分離 HEAD 指標`.
- [x] 324, Chinese and Traditional: `基础/基礎保护` -> `有限保护/有限保護`.
- [x] 356, Chinese and Traditional: use `关机/關機` action wording, not physical power wording.
- [x] 376, Traditional: `退出登入` -> `登出`.

### 401-600

- [x] 406, 417, 436, 437, Chinese: `子模块` -> `子模组` for Git submodule terminology.
- [x] 453, Chinese and Traditional: `SSH 变体/變體` -> `SSH 格式`; improve auth sentence.
- [x] 465, Chinese and Traditional: `服务器/伺服器持久化` -> `服务器持续运行` / `伺服器持續執行`.
- [x] 480, 483, 543, 549, 550, 551, 567, 575, 577, 594, 597, 599, Chinese: batch `Pro 解锁` -> `专业版解锁`.
- [x] 546, Chinese: `通过 Pro 解锁来配置子模块。` -> `通过专业版解锁配置子模组。`
- [x] 556, Chinese: use iOS wording `App 内购买`, `“设置”App`, `内容与隐私限制`, `iTunes Store 与 App Store 购买项目`.
- [x] 556, Traditional: use iOS wording `App 內購買`, `「設定」App`, `內容與隱私權限制`.

### 601-800

- [x] 601, Chinese and Traditional: rewrite checkout warning so current file changes may be lost and user should revert or commit.
- [x] 646, Chinese and Traditional: `解锁/解鎖到期 %@` -> `解锁/解鎖有效期至 %@`.
- [x] 665, Chinese: clarify Secure Enclave keys are available through pro unlock.
- [x] 754, Traditional: `全部切換` -> `切換全部檔案的暫存狀態`.
- [x] 780, Traditional: `退出登入` -> `登出`.
- [x] 791, Traditional: `退出登入。` -> `登出。`

### 801-1000

- [x] 850, Traditional: `ZIP 壓縮包` -> `ZIP 壓縮檔`.
- [x] 868, Traditional: `Working Copy.bak` -> `WorkingCopy.bak`.
- [x] 984, Chinese and Traditional: `正在解锁/解鎖` -> `正在转移/轉移解锁/解鎖权益`.

### 1001-1200

- [x] 1011, Chinese: remove stray space and naturalize `Developer settings` sentence.
- [x] 1011, Traditional: translate `Personal access tokens` as `個人存取權杖`.
- [x] 1023, Chinese: remove stray space and naturalize GitHub website sentence.
- [x] 1023, Traditional: translate `Personal access tokens` as `個人存取權杖`.
- [x] 1110, Traditional: `快\n進` -> `快\n轉`.
- [x] 1118, Traditional: `提交併與` -> `提交並與`.
- [x] 1119, Traditional: `不合並` -> `不合併`.
- [x] 1167, Chinese: remove the space before the quote around `%@`.

### 1201-1400

- [x] 1202, Chinese and Traditional: rewrite force-push refusal using `最新提交` instead of `头部/頭部提交`.
- [x] 1284, Chinese: `托管提供商` -> `托管服务商`.
- [x] 1315, Traditional: `語音識別` -> `語音辨識`; improve sentence.
- [x] 1326, Chinese and Traditional: use positional placeholders and clarify first `%@` is action type.
- [x] 1380, Traditional: `無專案` -> `無項目`.

### 1401-1600

- [x] 1439, Traditional: `「Nothing」操作` -> `「無」操作`.
- [x] 1519, Chinese and Traditional: make sync log completed action, `已从/已從 ... 删除/刪除，以匹配/符合 ...`.
- [x] 1564, Chinese: remove extra space between `标头` and `会`.
- [x] 1564, Traditional: `headers` -> `標頭`.

### 1601-1800

- [x] 1663, Chinese and Traditional: `有 %@` -> `%@` to avoid `有 無衝突`.
- [x] 1699, Chinese and Traditional: `%d 个匹配/個相符` -> `%d 个匹配结果` / `%d 個相符結果`.
- [x] 1701, Chinese and Traditional: `%d+ 个匹配/個相符` -> `%d+ 个匹配结果` / `%d+ 個相符結果`.
- [x] 1716, Chinese and Traditional: `1 个匹配/1 個相符` -> `1 个匹配结果` / `1 個相符結果`.
- [x] 1735, Chinese and Traditional: rewrite Cookie import duplicate message as `%@ 的所有 Cookie 均已存在。`
- [x] 1747, Chinese and Traditional: use existing wording `授权/授權 HTTP 传输/傳輸的替代方式`.
- [x] 1772, Chinese and Traditional: `指派人` -> `被分配者` / `受指派者`.
- [x] 1775, Chinese and Traditional: `创作/創作于 %@` -> `撰写/撰寫于 %@`.

### 1801-2000

- [x] 1846, Chinese and Traditional: `作为/作為 HEAD 提交` -> `将此提交设为 HEAD` / `將此提交設為 HEAD`.
- [x] 1890, Chinese and Traditional: fix port forwarding direction sentence.
- [x] 1955, Traditional: preserve required trailing ASCII space.
- [x] 1964, Chinese and Traditional: `双击/雙擊` -> touch wording, `轻触...两下` / `點兩下...`.
- [x] 1968, Chinese and Traditional: align `Dual Split View` with `分屏视图` / `分割顯示`.
- [x] 1980, Chinese: `电子邮箱地址` -> `电子邮件地址`.
- [x] 1992, Chinese and Traditional: align `Expand Split View` with `分屏视图` / `分割顯示`.

### 2001-2200

- [x] 2022, Chinese and Traditional: keep `Path` as setting name and translate `pathspec` as `路径规格/路徑規格`.
- [x] 2038, Chinese and Traditional: `(popped)` -> `读取后移除` / `讀取後移除`.
- [x] 2076, Chinese and Traditional: `Github` -> `GitHub`.
- [x] 2091, Traditional: `拖動的專案` -> `拖曳的項目`.
- [x] 2147, Traditional: `授權條款` -> `授權`.
- [x] 2159, Chinese and Traditional: `日志文件/日誌檔案支援` -> `提交日志/提交日誌支援`.
- [x] 2167, Chinese and Traditional: `Macbook Air` -> `MacBook Air`.
- [x] 2194, Chinese and Traditional: `光标/游標` -> `指针/指標` for iPadOS pointer support.

### 2201-2400

- [x] 2205, Traditional: `名稱空間` -> `命名空間`.
- [x] 2240, Chinese and Traditional: merge side `Our` -> `我方`.
- [x] 2247, Chinese and Traditional: `部分提交文件/檔案` -> `提交文件/檔案的部分内容/內容`.
- [x] 2260, Chinese and Traditional: improve placeholder sentence for picking text colors.
- [x] 2364, Traditional: `提交併遺失` -> `提交，並遺失`.
- [x] 2366, Traditional: `提交併遺失` -> `提交，並遺失`.

### 2401-2600

- [x] 2405, Traditional: `回撥` -> `回呼`.
- [x] 2484, Traditional: `檔案分享` -> `檔案共享`.
- [x] 2501, Chinese and Traditional: `复选/複選標記` -> `勾选/勾選狀態`.
- [x] 2530, Traditional: `回撥` -> `回呼`.
- [x] 2531, Traditional: `回撥` -> `回呼`.
- [x] 2544, Traditional: `存取 %@ 頁面` -> `造訪 %@ 頁面`.
- [x] 2545, Traditional: `存取 Gist 頁面` -> `造訪 Gist 頁面`.
- [x] 2546, Traditional: `存取 GitHub 頁面` -> `造訪 GitHub 頁面`.
- [x] 2547, Traditional: `存取 Glitch` -> `造訪 Glitch`.
- [x] 2552, Traditional: `相符所有版本庫` -> `會符合所有版本庫`.

### 2601-2800

- [x] 2639, Chinese and Traditional: rewrite `You need your own API key from ` prefix as `来源/來源：`.
- [x] 2703, Traditional: `增量語法高亮` -> `增量式語法突顯`.
- [x] 2764, Traditional: `語法高亮` -> `語法突顯`.

### 2801-3000

- [x] 2848, Chinese and Traditional: `新 %@ 分支` -> `新的 %@ 分支`.
- [x] 2857, Chinese and Traditional: rewrite remote branch deletion warning, avoid `对所有人删除/對所有人刪除`.
- [x] 2858, Chinese and Traditional: same remote deletion warning rewrite.
- [x] 2859, Chinese and Traditional: make conditional warning explicit with `如果删除/若刪除`.
- [x] 2860, Chinese and Traditional: make conditional warning explicit with `如果删除/若刪除`.
- [x] 2877, Chinese and Traditional: future consequence, `会被/會被更新`, not completed `已更新`.
- [x] 2897, Chinese and Traditional: align assignee wording with chosen standard `被分配者` / `受指派者`.
- [x] 2969, Chinese and Traditional: `删除出/刪除出` -> `向外删除/向外刪除`.

### 3001-3200

- [x] 3124, Chinese and Traditional: OAuth `Missing code` -> `缺少授权码` / `缺少授權碼`.
- [x] 3138, Traditional: `專案` -> `項目`; `廢紙簍` -> `垃圾桶`.
- [x] 3140, Traditional: rewrite as `有多個版本庫符合 repo 參數。`
- [x] 3150, Traditional: `相符所有` -> `比對所有`; keep `Pattern=...` tokens.

### 3201-3400

- [x] 3207, Chinese and Traditional: `路径/路徑規範` -> `路径/路徑規格`.
- [x] 3347, Traditional: `蜂窩網路` -> `行動網路`.
- [x] 3361, Traditional: `套接字` -> `通訊端`.
- [x] 3362, Traditional: `套接字` -> `通訊端`.
- [x] 3395, Traditional: `套接字` -> `通訊端`.
- [x] 3396, Traditional: `鑰匙串` -> `鑰匙圈`.

### 3401-3600

- [x] 3401, Traditional: rewrite as `無法推送，因為變更無法快轉。`
- [x] 3417, Chinese and Traditional: `无法/無法建议 AI 提交消息/訊息` -> `无法生成/無法產生 AI 提交消息/訊息建议/建議`.
- [x] 3421, Chinese and Traditional: `创建/建立缺失目录` -> `创建缺失的目录` / `建立缺少的目錄`.
- [x] 3432, Chinese and Traditional: same `Create Missing Directories` switch wording.
- [x] 3461, Chinese and Traditional: `身份/身分資訊` -> commit identity wording, `身份/身分`.
- [x] 3462, Traditional: `專案` -> `項目`.
- [x] 3504, Chinese and Traditional: `64 位十六进制/進位` -> `64 个/個十六进制/進位字符/字元`.
- [x] 3590, Chinese: `私密密钥` -> `私钥`.
- [x] 3598, Chinese and Traditional: `预览代码/預覽程式碼` -> `预览功能解锁码` / `預覽功能解鎖碼`.

### 3601-3800

- [x] 3603, Chinese: `解锁密钥` -> `解锁私钥`.
- [x] 3604, Chinese: `解锁 %@ 的密钥` -> `解锁 %@ 的私钥`.
- [x] 3606, Chinese and Traditional: rewrite clipboard placeholder order with `%1$@` and `%2$@`.
- [x] 3709, Chinese and Traditional: future consequence, `将创建/將建立`, not completed `已创建/已建立`.
- [x] 3710, Chinese and Traditional: future consequence, `将传输/將傳輸`, not completed `已传输/已傳輸`.
- [x] 3724, Chinese and Traditional: preserve required trailing ASCII space.
- [x] 3743, Traditional: WebDAV `分享` -> `共用`.
- [x] 3768, Chinese: `密钥环` -> `私钥环`, and imported keys as `私钥`.
- [x] 3783, Traditional: `提交併推送` -> `提交並推送`.

### 3801-4000

- [x] 3818, Chinese and Traditional: use AWS `IAM 用户/使用者`; note English source appears to typo `AIM`.
- [x] 3819, Traditional: `鑰匙串` -> `鑰匙圈`; preserve trailing space if the string requires it.
- [x] 3962, Traditional: `即時活動` -> `即時動態`.
- [x] 3978, Chinese and Traditional: avoid `头/頭提交`; use `head 提交` or rewrite.
- [x] 3989, Chinese and Traditional: rewrite API key provider prefix as `输入/輸入以下服务/服務提供的 API 密钥/金鑰：`.
- [x] 3995, Chinese and Traditional: `无法恢复地丢失/無法恢復地遺失` -> `永久丢失/遺失且无法/無法恢复/恢復`.

### 4001-4200

- [x] 4006, Chinese and Traditional: `包` -> `文档包` / `文件套件`.
- [x] 4007, Traditional: `回撥示例` -> `回呼範例`.
- [x] 4076, Chinese and Traditional: Git tag annotation `message` -> `标签说明` / `標籤說明`.
- [x] 4107, Traditional: `源引用` -> `來源引用`.
- [x] 4140, Chinese and Traditional: `包同步` -> `文档包同步` / `文件套件同步`.
- [x] 4175, Traditional: `壓縮包已解壓` -> `壓縮檔已解壓縮`.
- [x] 4193, Traditional: remove extra space after `啟用`; apply Server Persistence term decision if batch rule is applied.

### 4201-4302

- [x] 4201, Chinese and Traditional: `刚刚/剛剛正在同步` -> `正在同步...，刚刚/剛剛开始`.
- [x] 4247, Chinese and Traditional: `魔数头/魔數頭` -> `魔数标头/魔數標頭`.
- [x] 4264, Traditional: include `秘密` and `填入`; `分享擴充套件捷徑` -> `分享延伸功能捷徑`.
- [x] 4266, Chinese and Traditional: translate `Jump Debug` -> `跳转调试` / `跳轉偵錯`.
- [x] 4291, Traditional: add space in `Jupyter Notebook 將`; improve private gist sentence.

## Additional residual scan fixes

These were found after applying the first pass by scanning for the batch
terminology patterns above.

- [x] 31, Chinese: `Pro 解锁版` -> `专业版解锁`.
- [x] 600, Chinese: `通过 Pro 解锁` -> `通过专业版解锁`.
- [x] 1797, Traditional: `提交併輕鬆抓取` -> `提交並輕鬆抓取`.
- [x] 2395, 2396, 2397, Traditional: `退出登入` -> `登出`.
- [x] 2875, Traditional: `語法高亮` -> `語法突顯`.
- [x] 2881, Traditional: `壓縮包展平` -> `壓縮檔展平`.
- [x] 3030, Traditional: `合並` -> `合併`.
- [x] 3094, Traditional: `鑰匙串錯誤` -> `鑰匙圈錯誤`.
- [x] 3320, 3321, Traditional: `提交併推送` -> `提交並推送`.
