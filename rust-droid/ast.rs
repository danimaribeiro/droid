// ast.rs

pub enum Value {
    Int(i32),
    String(String),
    Float(f64),
}

pub struct WhereClause {
    pub column_name: String,
    pub op: String, 
    pub value: Value,
}

pub struct SelectStatement {
    pub table_name: String,
    pub column_names: Vec<String>,
    pub has_where: bool,
    pub where_clause: Option<WhereClause>,
}

pub struct InsertStatement {
    pub table_name: String,
    pub column_names: Vec<String>,
    pub values: Vec<Value>,
}

pub struct UpdateStatement {
    pub table_name: String,
    pub column_names: Vec<String>,
    pub new_values: Vec<Value>,
    pub has_where: bool,
    pub where_clause: Option<WhereClause>,
}

pub struct DeleteStatement {
    pub table_name: String,
    pub has_where: bool,
    pub where_clause: Option<WhereClause>,
}

pub enum Statement {
    Select(SelectStatement),
    Insert(InsertStatement),
    Update(UpdateStatement),
    Delete(DeleteStatement),
}

pub struct AstNode {
    pub statement: Option<Statement>,
    pub has_error: bool,
}
