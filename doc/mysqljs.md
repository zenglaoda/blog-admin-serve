# mysql2

## Escape
**Caution:** these methods of escaping values only works when the *NO_BACKSLASH_ESCAPES* SQL mode is disabled(which is the default state for MySQL servers)
当启用 NO_BACKSLASH_ESCAPES 模式时，反斜杠字符 `\` 不会被视为转义字符，而是作为普通字符处理。

1. 对字段值： 使用 mysql.escape(), connection.escape(), pool.escape() 进行转义。
2. 对字段值： 使用 `?` 占位符，内部会使用 escape 方法转义该占位符的内容
3. 不同的值类型以不同的方式进行转义，包含 `toSqlString` 方法的对象
4. 对字段: 使用 mysql.escapeId(), connection.escapeId(), pool.escapeId() 进行转义。
4. 对字段: 使用 `??` 占位符


mysql.raw():
  **Caution:** The string provided to mysql.raw() will skip all escaping functions when used, so be careful when passing in unvalidated input.

mysql.format(sql)
    可生成预查询语句


## FAQ
1. 精度处理: 启用 supportBigNumbers 选项以便能够将插入 id 读取为字符串，否则它会抛出错误
2. 大数据处理: 可以使用流的方式查询行
3. 多行查询


## Reference
- [npm mysql](https://www.npmjs.com/package/mysql#server-disconnects)
- [mysql2 文档](https://sidorares.github.io/node-mysql2/docs)