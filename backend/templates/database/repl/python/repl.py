import sys


def run_repl():
    while True:
        print("db > ", end="", flush=True)
        try:
            line = input()
        except EOFError:
            break
        line = line.strip()
        if line == ".exit":
            break
        print(f"Unrecognized command '{line}'.")
