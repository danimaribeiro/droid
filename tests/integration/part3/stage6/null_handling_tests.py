from tests.integration.utils import run_test_case

def test_null_handling():
    run_test_case(
        "null-handling-unimplemented-error",
        "insert into users (id, name, email) values (1, 'danimar', NULL);\nselect * from users where email IS NULL;\n.exit\n",
        "Unrecognized command 'insert' or Not implemented.\n",
        exit_code=0
    )
