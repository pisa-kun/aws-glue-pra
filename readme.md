# aws glue 調査まとめ

## Data set (csv file)

- https://github.com/aws-samples/amazon-sagemaker-immersion-day/blob/master/nyc-taxi.csv

#### Amazonの商品レビューの公開情報
- https://github.com/aws-samples/amazon-s3-datalake-handson/blob/master/datalake-handson-sample-data/amazon_reviews_JP.csv.gz

### はじめてのデータレイクハンズオン

[はじめてのデータレイクハンズオン](https://d1.awsstatic.com/events/jp/2021/summit-online/AWS-66_AWS_Summit_Online_2021_DataLake-Handson.v2.pdf)

#### 感想

詳細な手順がないので中級者向け

### AWS Glueを使って、データ分析基盤を構築する(CSV → Parquet)

[AWS Glueを使って、データ分析基盤を構築する(CSV → Parquet)](https://www.cloudnotes.tech/entry/glue-csv-parquet-athena)

#### want to do

1. Amazon S3に保管されているCSVファイルをParquetに変換し、Amazon S3に保管する。
2. S3に保管したParquetファイルをAthenaを使って参照する。

![text](https://cdn-ak.f.st-hatena.com/images/fotolife/y/ykoomaru/20191103/20191103151046.png)

#### テーブルの作成について
参照先の資料と手順が若干異なる？

Set table properties → choose or define schema → Review and create の順番

- Set table properties
  - table detailse-Database でglueのデータベース名を指定する
  - Data Store でS3を指定、Include pathでバケット名を末尾/で入力

- choose or define schema
  - 初回作成時は特に入力無し

- Review and create
  -  特になし

#### クローラーの作成
- step 2/5 choose data sources and classifiers
  - Data sources でAdd a data source
  - S3 pathを入力、subsequent crawler runs はデフォルトの Crawl all sub-folders

- step 3/5 configure security settings
  - create new IAM role で自動でIAMロールの作成と設定

- step 4/5 set output and scheduling
  - データベースを指定

crawlersの画面で対象のクローラーに対してRunコマンドを投げるとカタログが作成される
- テーブル-データからカタログを確認

#### ETLジョブの作成、Parquetファイルへの変換
- GUIでしかジョブを生成できない？？
  - source のS3とtargetのS3にバケット名を指定
  - targetのバケット選択時、**formatとcompression**を指定できる。parquetとgzipで
  - job details で type-Spark、Glue version-3.0、Language-python3
  - TransformationのNode propertiesはデフォルトがChange Schema。色々選べる
  - Dta sourceのs3 typeはs3 location-csv-Commaにする
  - **Roleの割り振りミス**で失敗するので注意

### AWS Glue Immersion day

[AWS Glue Immersion day](https://catalog.us-east-1.prod.workshops.aws/workshops/ee59d21b-4cb8-4b3d-a629-24537cf37bb5/en-US)

### AWS再入門ブログリレー2022 AWS Glue編

[AWS再入門ブログリレー2022 AWS Glue編](https://dev.classmethod.jp/articles/re-introduction-2022-aws-glue/)

### AWS Glue ETL パフォーマンス・チューニング① 基礎知識編 AWS Black Belt Online Seminar

[AWS Glue ETL パフォーマンス・チューニング① 基礎知識編 AWS Black Belt Online Seminar](https://pages.awscloud.com/rs/112-TZM-766/images/202108_Blackbelt_glue_etl_performance1.pdf)

### 指定のファイル数がS3バケットに到達したらGlueジョブを実行させる方法

[指定のファイル数がS3バケットに到達したらGlueジョブを実行させる方法](https://blog.serverworks.co.jp/run-glue-workflow-when-the-files-is-reached)

#### EventBrigeのターゲット先バケット設定

~~特定のバケットは bucket/object も可能~~
~~aws-glue-practice-pisakun/artifact/~~

条件式をjsonに追加して特定のプレフィックスへのイベントに限定することも可能
```json
{
  "source": ["aws.s3"],
  "detail-type": ["Object Created"],
  "detail": {
    "bucket": {
      "name": ["aws-glue-practice-pisakun"]
    },
    "object": {
      "key": [{
        "prefix": "artifact/"
      }]
    }
  }
}
```

[S3の特定パス配下にファイルが配置されたことを検知して、Amazon EventBridge(CloudwatchEvents)を実行する](https://www.cloudnotes.tech/entry/s3-prefix-cloudwatchevents)

### AWS Glue を 作成するための CloudFormation を組んでみました

[AWS Glue を 作成するための CloudFormation を組んでみました](https://tech.fusic.co.jp/posts/2021-10-07-aws-glue-cloud-formation/)


### AWS Glue Python Shell ジョブで CSV → Parquet 変換する ETL を実装する
- 2022/11/11
[AWS Glue Python Shell ジョブで CSV → Parquet 変換する ETL を実装する](https://blog.serverworks.co.jp/glue-pythonshell-parquet-etl)

#### flow
1. S3 から CSV ファイルをダウンロード
1. CSV ファイルを Pandas DataFrame に読み込む
1. データ加工（列を削除）
1. Parquet に変換
1. S3 にアップロード

#### s3作成

```powershell
// バケット作成  
$ aws s3 mb s3://python-gluejob-tomtom  
// フォルダ構成に見せかけるためのオブジェクトを作成  
$ aws s3api put-object --bucket python-gluejob-tomtom --key "in/"  
$ aws s3api put-object --bucket python-gluejob-tomtom --key "out/"  
```

[AWSのS3で階層付きバケットフォルダをサクッと作る](https://open-groove.net/s3/s3-create-bucket-folders/)

#### csvファイルのアップロード

```powershell
$ aws s3 cp .\files\test_0001_20221109.csv s3://python-gluejob-tomtom
```

#### ジョブ用のIAMロール作成

- ロール名:pythonshell-etl-sample-role
- ポリシー1:AWSGlueServiceRole(AWS Management)
- ポリシー2:pythonshell-etl-sample-policy(Customer Management)

[AWS CLI で IAM ロールを作成する](https://zenn.dev/y_u_t_a/articles/58257348c3754d)

**カスタマー管理ポリシーの作成**

```powershell
aws iam create-policy --policy-name pythonshell-etl-sample-policy --policy-document file://policy/policy_document.json
```

S3へのアクセスポリシー
```policy_document.json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "VisualEditor0",
            "Effect": "Allow",
            "Action": [
                "s3:PutObject",
                "s3:GetObject"
            ],
            "Resource": "arn:aws:s3:::python-gluejob-tomtom/*"
        }
    ]
}
```

**Arn**をメモしておくこと

**IAMロールの作成とアタッチ**

```glue_role.json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Principal": {
                "Service": [
                    "glue.amazonaws.com"
                ]
            },
            "Action": "sts:AssumeRole"
        }
    ]
}
```

```powershell
aws iam create-role --role-name pythonshell-etl-sample-role --assume-role-policy-document file://policy/glue_role.json
```


```powershell
aws iam attach-role-policy --role-name pythonshell-etl-sample-role --policy-arn arn:aws:iam::aws:policy/service-role/AWSGlueServiceRole

aws iam attach-role-policy --role-name pythonshell-etl-sample-role --policy-arn <作成したポリシーの ARN>
```

ロールにポリシー付与されているかの確認

```
aws iam list-attached-role-policies --role-name pythonshell-etl-sample-role
```