// lexer.rs

#[allow(non_camel_case_types)]
#[derive(Debug)]
pub enum TokenType {
    KEYWORD_INSERT,
    KEYWORD_UPDATE,
    KEYWORD_DELETE,
    KEYWORD_SELECT,
    KEYWORD_INTO,
    KEYWORD_VALUES,
    KEYWORD_FROM,
    KEYWORD_WHERE,
    IDENTIFIER,
    NUMBER,
    STRING,
    SYMBOL,
    EOF,
}

#[derive(Debug)]
pub struct Token {
    pub tk_type: TokenType,
    pub token: String,
}

#[derive(Debug)]
pub struct TokenList {
    pub tokens: Vec<Token>,
    pub has_error: bool,
}

impl Token {
    fn new(tk_type: TokenType, token: String) -> Token {
        return Token {
            tk_type,
            token,
        }
    }
}

fn is_symbol(c: char) -> bool {
    match c {
        '(' | ')' | ',' | ';' | '=' | '*' => true,
        _ => false,
    }
}

fn get_keyword_type(token: &str) -> TokenType {
    match token.to_uppercase().as_str() {
        "INSERT" => TokenType::KEYWORD_INSERT,
        "UPDATE" => TokenType::KEYWORD_UPDATE,
        "DELETE" => TokenType::KEYWORD_DELETE,
        "SELECT" => TokenType::KEYWORD_SELECT,
        "INTO" => TokenType::KEYWORD_INTO,
        "VALUES" => TokenType::KEYWORD_VALUES,
        "FROM" => TokenType::KEYWORD_FROM,
        "WHERE" => TokenType::KEYWORD_WHERE,
        _ => TokenType::IDENTIFIER,
    }
}

pub fn tokenize(input: &str) -> TokenList {
    let mut list: TokenList = TokenList { tokens: Vec::new(), has_error: false };

    let mut i = 0;
    let chars: Vec<char> = input.chars().collect();
    let len = chars.len();

    while i < len {
        if chars[i] == ' ' {
            i += 1;
        } else if is_symbol(chars[i]) {
            let tk = Token::new(TokenType::SYMBOL, chars[i].to_string());
            list.tokens.push(tk);
            i += 1;
        } else if chars[i].is_alphabetic() {
            let start = i;
            while i < len && (chars[i].is_alphanumeric() || chars[i] == '_') {
                i += 1;
            }
            let length = i - start;
            let token: String = chars[start..start + length].iter().collect();
            let tk_type = get_keyword_type(&token);
            let tk = Token::new(tk_type, token);
            list.tokens.push(tk);
        } else if chars[i].is_digit(10) {
            let start = i;
            while i < len && (chars[i].is_digit(10) || chars[i] == '.') {
                i += 1;
            }
            let length = i - start;
            let token: String = chars[start..start + length].iter().collect();
            let tk = Token::new(TokenType::NUMBER, token);
            list.tokens.push(tk);
        } else if chars[i] == '"' {
            let start = i;
            i += 1;
            while i < len && chars[i] != '"' {
                i += 1;
            }
            if i == len {
                println!("[ERROR:00302] Missing closing quote");
                list.has_error = true;
                return list;
            }
            let length = i - start;
            let token: String = chars[start..start + length].iter().collect();
            let tk = Token::new(TokenType::STRING, token);
            list.tokens.push(tk);
            i += 1;
        } else {
            println!("[ERROR:00303] Unexpected character: {}", chars[i]);
            list.has_error = true;
            break;
        }
    }
    return list;
}
