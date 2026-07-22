.PHONY: all build-c build-cpp build-rust build-zig run-c run-cpp run-rust run-zig run-all test test-smoke check-bins test-stage1 test-stage2 test-stage3 test-all-stages test-c-stage1 test-cpp-stage1 test-rust-stage1 test-zig-stage1 clean

CC := gcc
CXX := g++
RUSTC := rustc
ZIG := zig
BIN_DIR := bin

C_BIN := $(BIN_DIR)/c-db
CPP_BIN := $(BIN_DIR)/cpp-db
RUST_BIN := $(BIN_DIR)/rust-db
ZIG_BIN := $(BIN_DIR)/zig-db
BINS := $(C_BIN) $(CPP_BIN) $(RUST_BIN) $(ZIG_BIN)

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

check-bins:
	@missing=0; \
	for bin in $(BINS); do \
		if [ ! -x "$$bin" ]; then \
			echo "Missing binary: $$bin"; \
			missing=1; \
		fi; \
	done; \
	if [ "$$missing" -ne 0 ]; then \
		echo "Build binaries first with: make all"; \
		exit 1; \
	fi

test-stage1: check-bins
	@python3 tests/integration/python/run_tests.py --stage stage1 --bins $(BINS)

test-c-stage1:
	@if [ ! -x "$(C_BIN)" ]; then echo "Missing binary: $(C_BIN)"; echo "Build it with: make build-c"; exit 1; fi
	@python3 tests/integration/python/run_tests.py --stage stage1 --bins $(C_BIN)

test-cpp-stage1:
	@if [ ! -x "$(CPP_BIN)" ]; then echo "Missing binary: $(CPP_BIN)"; echo "Build it with: make build-cpp"; exit 1; fi
	@python3 tests/integration/python/run_tests.py --stage stage1 --bins $(CPP_BIN)

test-rust-stage1:
	@if [ ! -x "$(RUST_BIN)" ]; then echo "Missing binary: $(RUST_BIN)"; echo "Build it with: make build-rust"; exit 1; fi
	@python3 tests/integration/python/run_tests.py --stage stage1 --bins $(RUST_BIN)

test-zig-stage1:
	@if [ ! -x "$(ZIG_BIN)" ]; then echo "Missing binary: $(ZIG_BIN)"; echo "Build it with: make build-zig"; exit 1; fi
	@python3 tests/integration/python/run_tests.py --stage stage1 --bins $(ZIG_BIN)

test-stage2: check-bins
	@python3 tests/integration/python/run_tests.py --stage stage2 --bins $(BINS)

test-stage3: check-bins
	@python3 tests/integration/python/run_tests.py --stage stage3 --bins $(BINS)

test-all-stages: check-bins
	@python3 tests/integration/python/run_tests.py --stage all --bins $(BINS)

clean:
	rm -rf $(BIN_DIR)
