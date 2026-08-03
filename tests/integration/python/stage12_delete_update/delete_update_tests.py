import os
from collections import namedtuple
from utils import run_command, verify_result, print_test_result

TestCase = namedtuple("TestCase", ["name", "input_data", "expected_lines", "not_expected_lines"])

TESTS = [
    TestCase(
        name="delete-existing-row",
        input_data="""
insert into users (id, name, email) values (1, 'Alice', 'alice@test.com');
insert into users (id, name, email) values (2, 'Bob', 'bob@test.com');
insert into users (id, name, email) values (3, 'Charlie', 'charlie@test.com');
delete from users where id = 2;
select * from users;
.exit
""",
        expected_lines=[
            "Insert statement executed successfully",
            "Insert statement executed successfully",
            "Insert statement executed successfully",
            "Delete statement executed successfully",
            "(1, Alice, alice@test.com)",
            "(3, Charlie, charlie@test.com)",
            "(2 rows)"
        ],
        not_expected_lines=["(2, Bob, bob@test.com)", "(3 rows)"]
    ),
    TestCase(
        name="delete-non-existing-row",
        input_data="""
insert into users (id, name, email) values (1, 'Alice', 'alice@test.com');
delete from users where id = 99;
select * from users;
.exit
""",
        expected_lines=[
            "Insert statement executed successfully",
            "Error: Row not found",
            "(1, Alice, alice@test.com)",
            "(1 rows)"
        ],
        not_expected_lines=[]
    ),
    TestCase(
        name="update-existing-row",
        input_data="""
insert into users (id, name, email) values (1, 'Alice', 'alice@test.com');
update users set name = 'Alicia' where id = 1;
select * from users;
.exit
""",
        expected_lines=[
            "Insert statement executed successfully",
            "Update statement executed successfully",
            "(1, Alicia, alice@test.com)",
            "(1 rows)"
        ],
        not_expected_lines=["(1, Alice, alice@test.com)"]
    ),
    TestCase(
        name="update-non-existing-row",
        input_data="""
update users set name = 'Ghost' where id = 99;
.exit
""",
        expected_lines=[
            "Error: Row not found"
        ],
        not_expected_lines=["Update statement executed successfully"]
    ),
    TestCase(
        name="delete-multiple-rows-and-verify-btree",
        input_data="""
insert into users (id, name, email) values (1, 'user1', 'u1@test.com');
insert into users (id, name, email) values (2, 'user2', 'u2@test.com');
insert into users (id, name, email) values (3, 'user3', 'u3@test.com');
insert into users (id, name, email) values (4, 'user4', 'u4@test.com');
delete from users where id = 2;
delete from users where id = 4;
btree dump 0
.exit
""",
        expected_lines=[
            "Delete statement executed successfully",
            "Delete statement executed successfully",
            "[BTREE] Page 0: type=LEAF is_root=1 num_cells=2",
            "  cell 0: key=1",
            "  cell 1: key=3"
        ],
        not_expected_lines=["cell 2:", "cell 3:"]
    )
]

def run_suite(binary_path: str) -> bool:
    all_passed = True
    print("\n--- Running Stage 12: DELETE & UPDATE (Fixed-Size) Tests ---")
    for test in TESTS:
        # Clean db file for isolation
        if os.path.exists("droid.db"):
            os.remove("droid.db")
        if os.path.exists("bin/droid.db"):
            os.remove("bin/droid.db")
            
        stdout, stderr, returncode = run_command(binary_path, test.input_data)
        
        passed, reason = verify_result(stdout, returncode, test.expected_lines, test.not_expected_lines)
        if not passed:
            all_passed = False
            
        print_test_result(test.name, passed, reason, stdout, stderr, returncode, test.input_data, test.expected_lines, test.not_expected_lines)
        
    return all_passed
