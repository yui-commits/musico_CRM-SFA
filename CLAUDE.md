# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 現状

要件定義フェーズ。実装コードはまだ存在しない。技術スタック（言語・FW・DB）は未確定。

仕様のソース・オブ・トゥルースは `要件定義/` 配下の4ファイル：
- `【全体概要】` — DBスキーマ・CSV一括登録・AIトーク生成・認証設計
- `【フェーズ1】テレアポ管理（Pre-APO）` — 架電リスト管理のUI/UX
- `【フェーズ2】商談・体験会進行（Post-APO）` — カンバンボードのUI/UX
- `【追加要件】データ分析ダッシュボード` — KPI・グラフ・フィルター設計

## システム概要

幼稚園・保育園向けバイオリン教室「ムジコ」の社内向けCRM/SFA。
テレアポ → 面談 → 体験会 → 開講判断 の営業全プロセスを一元管理する。

## データモデル（全機能の基盤）

### `facilities`（施設マスタ）
- `phone_number` — ハイフンなし数字のみに正規化済み。**UNIQUEキー兼CSVマッチングキー**
- `lead_status` — Pre-APO管理用。`アポ獲得` になった瞬間、施設がPost-APOカンバンへ自動移行する
- `deal_status` — Post-APOカンバンの現在レーン。詳細なEnum定義は全体概要を参照
- `features` — 園の特色テキスト。AIトーク生成のプロンプト入力元
- `ai_sales_script` — AI生成済みの営業トーク。非同期で生成・保存（生成前はNULL）

### `activities`（活動履歴）
- `facility_id` — FK to `facilities`（1対多。ON DELETE CASCADE）
- `sales_person` — localStorage から自動セット。フォームはreadonly
- `called_at` — **ダッシュボードの全時系列集計の基準カラム**
- `call_status` — `facilities.lead_status` と連動して更新される

## 実装時の重要な判断軸

| # | 何を | なぜ | どうする |
|---|---|---|---|
| 1 | 電話番号の正規化 | CSVマッチングが電話番号依存のため | 全角→半角変換後、数字以外を全削除してからDB検索 |
| 2 | AIトーク生成 | 数百件の一括インポート時にUIをブロックしないため | 非同期キュー（Redis等）。失敗時は最大3回リトライ後にNULLのまま保持し、UI上に「再生成」ボタンを置く |
| 3 | 認証 | 社内ツールのため権限管理不要 | DBにユーザーテーブルなし。`localStorage['musico_sales_person']` のみで担当者を識別 |
| 4 | 開講判断 | 採算ラインが3名 | `enrollment_count >= 3` で `開講決定・準備中` へ |
