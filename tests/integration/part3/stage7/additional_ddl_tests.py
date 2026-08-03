from tests.integration.utils import run_test_case

def test_additional_ddl():
    run_test_case(
        "additional-ddl-unimplemented-error",
        "drop table users;\n.exit\n",
        "Unrecognized command 'drop' or Not implemented.\n",
        exit_code=0
    )
