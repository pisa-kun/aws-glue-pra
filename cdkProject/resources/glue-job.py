import pandas as pd
import re
import mojimoji
import datetime
import boto3
import io

print('script start.')

MY_BUCKET = 'cdk-glue-tomtom-bucket'
LOCAL_FILE_PATH = '/tmp'

file = 'in/test_0001_20221109.csv'

s3 = boto3.resource('s3')
src_obj = s3.Object(MY_BUCKET, file)
body = src_obj.get()['Body'].read().decode('utf-8') # 文字コードはcsv ファイルを作成したOSに合わせて変更してください
buffer_str = io.StringIO(body)

# Pandas DataFrame に読み込む
df = pd.read_csv(buffer_str)
print(df)

# searchできない場合はm.groupで例外発生
m = re.search(r'\d{4}', file)
f = m.group()

m2 = re.search(r'\d{8}', file)
t = m2.group()

# フォーマットの追加
# 先頭に追加
df.insert(0, "format", f)
# 日付の追加
# 2行目に追加
df.insert(1, "time", t) 

# CF, FZのみ抜き出し
isModel = df['serial'].str.startswith(("CF", "FZ"))

# - 削除
df['serial'] = df[isModel]['serial'].apply(lambda serial: serial.replace('-', ''))

# memoフィールドの英数字を全角から半角に
df['memo'] = df[isModel]['memo'].apply(lambda str: mojimoji.zen_to_han(str, kana=False))
df['memo'] = df[isModel]['memo'].apply(lambda str: mojimoji.han_to_zen(str, ascii=False, digit=False))

# JST to UTC
jst2utc = datetime.timedelta(hours=-9)
df['inputdate'] = df[isModel]['inputdate'].apply(lambda str: (datetime.datetime.strptime(str, "%Y-%m-%d %H:%M:%S.%f") + jst2utc))

# df型は列番号をもつので、indexは無視する
df[isModel].to_csv(LOCAL_FILE_PATH + '/test_20221109.csv', index=False)
#df[isModel].to_parquet(LOCAL_FILE_PATH + "/test_20221109.parquet", index=False)

s3.meta.client.upload_file(LOCAL_FILE_PATH + '/test_20221109.csv', MY_BUCKET, 'out/test_20221109.csv')

print("script complete.")