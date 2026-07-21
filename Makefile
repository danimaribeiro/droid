.PHONY: all build-c build-cpp build-rust build-zig run-c run-cpp run-rust run-zig run-all test test-smoke test-stage1 test-stage2 test-stage3 test-all-stages clean

CC := gcc
CXX := g++
RUSTC := rustc
ZIG := zig
BIN_DIR := bin

C_BIN := $(BIN_DIR)/c-db
CPP_BIN := $(BIN_DIR)/cpp-db
RUST_BIN := $(BIN_DIR)/rust-db
ZIG_BIN := $(BIN_DIR)/zig-db

all: build-c build-cpp build-rust build-zig

$(BIN_DIR):
	@mkdir -p $(BIN_DIR)

build-c: $(BIN_DIR)
	$(CC) c-droid/main.c -o $(C_BIN)

build-cpp: $(BIN_DIR)
	$(CXX) cpp-droid/main.cpp -o $(CPP_BIN)

build-rust: $(BIN_DIR)
	$(RUSTC) rust-droid/main.rs -o $(RUST_BIN)

build-zig: $(BIN_DIR)
	$(ZIG) build-exe zig-droid/main.zig -femit-bin=$(ZIG_BIN)

run-c: build-c
	@$(C_BIN)

run-cpp: build-cpp
	@$(CPP_BIN)

run-rust: build-rust
	@$(RUST_BIN)

run-zig: build-zig
	@$(ZIG_BIN)

run-all: all
	@$(C_BIN)
	@$(CPP_BIN)
	@$(RUST_BIN)
	@$(ZIG_BIN)

test: test-stage1

test-smoke: all
	@echo "Running tests..."
	@$(C_BIN) | grep -qx "droid-c ok"
	@$(CPP_BIN) | grep -qx "droid-cpp ok"
	@$(RUST_BIN) | grep -qx "droid-rust ok"
	@$(ZIG_BIN) | grep -qx "droid-zig ok"
	@echo "All tests passed."

test-stage1: all
	@python3 tests/integration/python/run_tests.py --stage stage1 --bins $(C_BIN) $(CPP_BIN) $(RUST_BIN) $(ZIG_BIN)

test-stage2: all
	@python3 tests/integration/python/run_tests.py --stage stage2 --bins $(C_BIN) $(CPP_BIN) $(RUST_BIN) $(ZIG_BIN)

test-stage3: all
	@python3 tests/integration/python/run_tests.py --stage stage3 --bins $(C_BIN) $(CPP_BIN) $(RUST_BIN) $(ZIG_BIN)

test-all-stages: all
	@python3 tests/integration/python/run_tests.py --stage all --bins $(C_BIN) $(CPP_BIN) $(RUST_BIN) $(ZIG_BIN)

clean:
	rm -rf $(BIN_DIR)
