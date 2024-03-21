# blog

## 字段命名

1. 数据库名字，表名，字段名采用下划线命名方式
2. 接口字段使用驼峰命名
3. 控制器的字符串长度校验以字符个数为单位，值为存储长度的1/4
4. 控制器的字符串长度校验以字节数为单位

## 需求

分类:

1. 分类支持创建任意层级，可以随意改变层级
2. 存在子分类的分类不能删除

文章:

1. 文章可以挂载在任何一个分类下面
2. 存在文章的分类及其父分类不能被直接删除
3. 新增的文章状态只能是 draft, final
4. 修改文章时 （draft, final） => （draft, final）， retracted => （draft, final）, published 不能进行修改
5. 发版与撤稿操作均在文章列表页操作

## 枚举值

- article status

| 1    | 2      | 3      | 4      |
| ---- | ------ | ------ | ------ |
| 草稿 | 已完成 | 已发布 | 已撤稿 |

- article format

| 1   | 2    | 3   | 4   | 5   | 6   | 7    | 8   | 9   |
| --- | ---- | --- | --- | --- | --- | ---- | --- | --- |
| md  | html | js  | ts  | tsx | txt | json | vue | sql |

- series status

| 1    | 2      | 3      | 4      |
| ---- | ------ | ------ | ------ |
| 草稿 | 已完成 | 已发布 | 已撤稿 |

## 建表

- category

1. 分类不限层级
2. 分类顺序需要固定，分类层级可随意移动

| id      | pid         | next_id        | title        | description  | c_time            | m_time            |
| ------- | ----------- | -------------- | ------------ | ------------ | ----------------- | ----------------- |
| INT     | INT         | INT            | VARCHAR(160) | VARCHAR(800) | CURRENT_TIMESTAMP | CURRENT_TIMESTAMP |
| 分类 id | 父级分类 id | 下一个目录的id | 分类名       | 目录描述     | 创建时间          | 修改时间          |

- article

| id      | c_id    | title        | keyword      | content  | format   | file_name    | status   | c_time            | m_time            |
| ------- | ------- | ------------ | ------------ | -------- | -------- | ------------ | -------- | ----------------- | ----------------- |
| INT     | INT     | VARCHAR(800) | VARCHAR(800) | TEXT     | CHAR     | VARCHAR(400) | CHAR     | CURRENT_TIMESTAMP | CURRENT_TIMESTAMP |
| 文章 id | 分类 id | 文章名       | 文章关键词   | 文章内容 | 文章格式     | 文件名       | 文章状态 | 创建时间          | 修改时间          |

- article_trash

| id      | c_id    | title        | keyword      | content  | format   | file_name    | status   | c_time            | m_time            |
| ------- | ------- | ------------ | ------------ | -------- | -------- | ------------ | -------- | ----------------- | ----------------- |
| INT     | INT     | VARCHAR(800) | VARCHAR(800) | TEXT     | CHAR     | VARCHAR(400) | CHAR     | CURRENT_TIMESTAMP | CURRENT_TIMESTAMP |
| 记录 Id | 分类 id | 文章名       | 文章关键词   | 文章内容 | 文章格式     | 文件名       | 文章状态 | 创建时间          | 修改时间          |

- series

| id      | description | title    | status   | c_time   | m_time   |
| ------- | ----------- | -------- | -------- | -------- | -------- |
| 栏目 id | 栏目描述    | 栏目名称 | 栏目状态 | 创建时间 | 修改时间 |

- series_blog

| id      | article_id | c_time   | m_time   |
| ------- | ---------- | -------- | -------- |
| 栏目 id | 文章 id    | 创建时间 | 修改时间 |
