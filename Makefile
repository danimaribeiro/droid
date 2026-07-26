.PHONY: all build-c build-cpp build-rust build-zig run-c run-cpp run-rust run-zig run-all test test-smoke check-bins test-stage1 test-stage2 test-stage3 test-stage4 test-stage5 test-stage6 test-stage7 test-stage8 test-stage9 test-stage10 test-stage11 test-stage12 test-stage13 test-stage14 test-stage15 test-stage16 test-stage17 test-stage18 test-all-stages test-c-stage1 test-cpp-stage1 test-rust-stage1 test-zig-stage1 clean

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

test-c-stage2:
	@if [ ! -x "$(C_BIN)" ]; then echo "Missing binary: $(C_BIN)"; echo "Build it with: make build-c"; exit 1; fi
	@python3 tests/integration/python/run_tests.py --stage stage2 --bins $(C_BIN)

test-cpp-stage2:
	@if [ ! -x "$(CPP_BIN)" ]; then echo "Missing binary: $(CPP_BIN)"; echo "Build it with: make build-cpp"; exit 1; fi
	@python3 tests/integration/python/run_tests.py --stage stage2 --bins $(CPP_BIN)

test-rust-stage2:
	@if [ ! -x "$(RUST_BIN)" ]; then echo "Missing binary: $(RUST_BIN)"; echo "Build it with: make build-rust"; exit 1; fi
	@python3 tests/integration/python/run_tests.py --stage stage2 --bins $(RUST_BIN)

test-zig-stage2:
	@if [ ! -x "$(ZIG_BIN)" ]; then echo "Missing binary: $(ZIG_BIN)"; echo "Build it with: make build-zig"; exit 1; fi
	@python3 tests/integration/python/run_tests.py --stage stage2 --bins $(ZIG_BIN)

test-stage3: check-bins
	@python3 tests/integration/python/run_tests.py --stage stage3 --bins $(BINS)

test-c-stage3:
	@if [ ! -x "$(C_BIN)" ]; then echo "Missing binary: $(C_BIN)"; echo "Build it with: make build-c"; exit 1; fi
	@python3 tests/integration/python/run_tests.py --stage stage3 --bins $(C_BIN)

test-cpp-stage3:
	@if [ ! -x "$(CPP_BIN)" ]; then echo "Missing binary: $(CPP_BIN)"; echo "Build it with: make build-cpp"; exit 1; fi
	@python3 tests/integration/python/run_tests.py --stage stage3 --bins $(CPP_BIN)

test-rust-stage3:
	@if [ ! -x "$(RUST_BIN)" ]; then echo "Missing binary: $(RUST_BIN)"; echo "Build it with: make build-rust"; exit 1; fi
	@python3 tests/integration/python/run_tests.py --stage stage3 --bins $(RUST_BIN)

test-zig-stage3:
	@if [ ! -x "$(ZIG_BIN)" ]; then echo "Missing binary: $(ZIG_BIN)"; echo "Build it with: make build-zig"; exit 1; fi
	@python3 tests/integration/python/run_tests.py --stage stage3 --bins $(ZIG_BIN)

test-stage4: check-bins
	@python3 tests/integration/python/run_tests.py --stage stage4 --bins $(BINS)

test-c-stage4:
	@if [ ! -x "$(C_BIN)" ]; then echo "Missing binary: $(C_BIN)"; echo "Build it with: make build-c"; exit 1; fi
	@python3 tests/integration/python/run_tests.py --stage stage4 --bins $(C_BIN)

test-cpp-stage4:
	@if [ ! -x "$(CPP_BIN)" ]; then echo "Missing binary: $(CPP_BIN)"; echo "Build it with: make build-cpp"; exit 1; fi
	@python3 tests/integration/python/run_tests.py --stage stage4 --bins $(CPP_BIN)

test-rust-stage4:
	@if [ ! -x "$(RUST_BIN)" ]; then echo "Missing binary: $(RUST_BIN)"; echo "Build it with: make build-rust"; exit 1; fi
	@python3 tests/integration/python/run_tests.py --stage stage4 --bins $(RUST_BIN)

test-zig-stage4:
	@if [ ! -x "$(ZIG_BIN)" ]; then echo "Missing binary: $(ZIG_BIN)"; echo "Build it with: make build-zig"; exit 1; fi
	@python3 tests/integration/python/run_tests.py --stage stage4 --bins $(ZIG_BIN)

test-stage5: check-bins
	@python3 tests/integration/python/run_tests.py --stage stage5 --bins $(BINS)

test-c-stage5:
	@if [ ! -x "$(C_BIN)" ]; then echo "Missing binary: $(C_BIN)"; echo "Build it with: make build-c"; exit 1; fi
	@python3 tests/integration/python/run_tests.py --stage stage5 --bins $(C_BIN)

test-cpp-stage5:
	@if [ ! -x "$(CPP_BIN)" ]; then echo "Missing binary: $(CPP_BIN)"; echo "Build it with: make build-cpp"; exit 1; fi
	@python3 tests/integration/python/run_tests.py --stage stage5 --bins $(CPP_BIN)

test-rust-stage5:
	@if [ ! -x "$(RUST_BIN)" ]; then echo "Missing binary: $(RUST_BIN)"; echo "Build it with: make build-rust"; exit 1; fi
	@python3 tests/integration/python/run_tests.py --stage stage5 --bins $(RUST_BIN)

test-zig-stage5:
	@if [ ! -x "$(ZIG_BIN)" ]; then echo "Missing binary: $(ZIG_BIN)"; echo "Build it with: make build-zig"; exit 1; fi
	@python3 tests/integration/python/run_tests.py --stage stage5 --bins $(ZIG_BIN)

test-stage6: check-bins
	@python3 tests/integration/python/run_tests.py --stage stage6 --bins $(BINS)

test-c-stage6:
	@if [ ! -x "$(C_BIN)" ]; then echo "Missing binary: $(C_BIN)"; echo "Build it with: make build-c"; exit 1; fi
	@python3 tests/integration/python/run_tests.py --stage stage6 --bins $(C_BIN)

test-cpp-stage6:
	@if [ ! -x "$(CPP_BIN)" ]; then echo "Missing binary: $(CPP_BIN)"; echo "Build it with: make build-cpp"; exit 1; fi
	@python3 tests/integration/python/run_tests.py --stage stage6 --bins $(CPP_BIN)

test-rust-stage6:
	@if [ ! -x "$(RUST_BIN)" ]; then echo "Missing binary: $(RUST_BIN)"; echo "Build it with: make build-rust"; exit 1; fi
	@python3 tests/integration/python/run_tests.py --stage stage6 --bins $(RUST_BIN)

test-zig-stage6:
	@if [ ! -x "$(ZIG_BIN)" ]; then echo "Missing binary: $(ZIG_BIN)"; echo "Build it with: make build-zig"; exit 1; fi
	@python3 tests/integration/python/run_tests.py --stage stage6 --bins $(ZIG_BIN)

test-stage7: check-bins
	@python3 tests/integration/python/run_tests.py --stage stage7 --bins $(BINS)

test-c-stage7:
	@if [ ! -x "$(C_BIN)" ]; then echo "Missing binary: $(C_BIN)"; echo "Build it with: make build-c"; exit 1; fi
	@python3 tests/integration/python/run_tests.py --stage stage7 --bins $(C_BIN)

test-cpp-stage7:
	@if [ ! -x "$(CPP_BIN)" ]; then echo "Missing binary: $(CPP_BIN)"; echo "Build it with: make build-cpp"; exit 1; fi
	@python3 tests/integration/python/run_tests.py --stage stage7 --bins $(CPP_BIN)

test-rust-stage7:
	@if [ ! -x "$(RUST_BIN)" ]; then echo "Missing binary: $(RUST_BIN)"; echo "Build it with: make build-rust"; exit 1; fi
	@python3 tests/integration/python/run_tests.py --stage stage7 --bins $(RUST_BIN)

test-zig-stage7:
	@if [ ! -x "$(ZIG_BIN)" ]; then echo "Missing binary: $(ZIG_BIN)"; echo "Build it with: make build-zig"; exit 1; fi
	@python3 tests/integration/python/run_tests.py --stage stage7 --bins $(ZIG_BIN)

test-stage8: check-bins
	@python3 tests/integration/python/run_tests.py --stage stage8 --bins $(BINS)

test-c-stage8:
	@if [ ! -x "$(C_BIN)" ]; then echo "Missing binary: $(C_BIN)"; echo "Build it with: make build-c"; exit 1; fi
	@python3 tests/integration/python/run_tests.py --stage stage8 --bins $(C_BIN)

test-cpp-stage8:
	@if [ ! -x "$(CPP_BIN)" ]; then echo "Missing binary: $(CPP_BIN)"; echo "Build it with: make build-cpp"; exit 1; fi
	@python3 tests/integration/python/run_tests.py --stage stage8 --bins $(CPP_BIN)

test-rust-stage8:
	@if [ ! -x "$(RUST_BIN)" ]; then echo "Missing binary: $(RUST_BIN)"; echo "Build it with: make build-rust"; exit 1; fi
	@python3 tests/integration/python/run_tests.py --stage stage8 --bins $(RUST_BIN)

test-zig-stage8:
	@if [ ! -x "$(ZIG_BIN)" ]; then echo "Missing binary: $(ZIG_BIN)"; echo "Build it with: make build-zig"; exit 1; fi
	@python3 tests/integration/python/run_tests.py --stage stage8 --bins $(ZIG_BIN)

test-stage9: check-bins
	@python3 tests/integration/python/run_tests.py --stage stage9 --bins $(BINS)

test-c-stage9:
	@if [ ! -x "$(C_BIN)" ]; then echo "Missing binary: $(C_BIN)"; echo "Build it with: make build-c"; exit 1; fi
	@python3 tests/integration/python/run_tests.py --stage stage9 --bins $(C_BIN)

test-cpp-stage9:
	@if [ ! -x "$(CPP_BIN)" ]; then echo "Missing binary: $(CPP_BIN)"; echo "Build it with: make build-cpp"; exit 1; fi
	@python3 tests/integration/python/run_tests.py --stage stage9 --bins $(CPP_BIN)

test-rust-stage9:
	@if [ ! -x "$(RUST_BIN)" ]; then echo "Missing binary: $(RUST_BIN)"; echo "Build it with: make build-rust"; exit 1; fi
	@python3 tests/integration/python/run_tests.py --stage stage9 --bins $(RUST_BIN)

test-zig-stage9:
	@if [ ! -x "$(ZIG_BIN)" ]; then echo "Missing binary: $(ZIG_BIN)"; echo "Build it with: make build-zig"; exit 1; fi
	@python3 tests/integration/python/run_tests.py --stage stage9 --bins $(ZIG_BIN)

test-stage10: check-bins
	@python3 tests/integration/python/run_tests.py --stage stage10 --bins $(BINS)

test-c-stage10:
	@if [ ! -x "$(C_BIN)" ]; then echo "Missing binary: $(C_BIN)"; echo "Build it with: make build-c"; exit 1; fi
	@python3 tests/integration/python/run_tests.py --stage stage10 --bins $(C_BIN)

test-cpp-stage10:
	@if [ ! -x "$(CPP_BIN)" ]; then echo "Missing binary: $(CPP_BIN)"; echo "Build it with: make build-cpp"; exit 1; fi
	@python3 tests/integration/python/run_tests.py --stage stage10 --bins $(CPP_BIN)

test-rust-stage10:
	@if [ ! -x "$(RUST_BIN)" ]; then echo "Missing binary: $(RUST_BIN)"; echo "Build it with: make build-rust"; exit 1; fi
	@python3 tests/integration/python/run_tests.py --stage stage10 --bins $(RUST_BIN)

test-zig-stage10:
	@if [ ! -x "$(ZIG_BIN)" ]; then echo "Missing binary: $(ZIG_BIN)"; echo "Build it with: make build-zig"; exit 1; fi
	@python3 tests/integration/python/run_tests.py --stage stage10 --bins $(ZIG_BIN)

test-stage11: check-bins
	@python3 tests/integration/python/run_tests.py --stage stage11 --bins $(BINS)

test-c-stage11:
	@if [ ! -x "$(C_BIN)" ]; then echo "Missing binary: $(C_BIN)"; echo "Build it with: make build-c"; exit 1; fi
	@python3 tests/integration/python/run_tests.py --stage stage11 --bins $(C_BIN)

test-stage12: check-bins
	@python3 tests/integration/python/run_tests.py --stage stage12 --bins $(BINS)

test-c-stage12:
	@if [ ! -x "$(C_BIN)" ]; then echo "Missing binary: $(C_BIN)"; echo "Build it with: make build-c"; exit 1; fi
	@python3 tests/integration/python/run_tests.py --stage stage12 --bins $(C_BIN)

test-stage13: check-bins
	@python3 tests/integration/python/run_tests.py --stage stage13 --bins $(BINS)

test-c-stage13:
	@if [ ! -x "$(C_BIN)" ]; then echo "Missing binary: $(C_BIN)"; echo "Build it with: make build-c"; exit 1; fi
	@python3 tests/integration/python/run_tests.py --stage stage13 --bins $(C_BIN)

test-stage14: check-bins
	@python3 tests/integration/python/run_tests.py --stage stage14 --bins $(BINS)

test-c-stage14:
	@if [ ! -x "$(C_BIN)" ]; then echo "Missing binary: $(C_BIN)"; echo "Build it with: make build-c"; exit 1; fi
	@python3 tests/integration/python/run_tests.py --stage stage14 --bins $(C_BIN)

test-stage15: check-bins
	@python3 tests/integration/python/run_tests.py --stage stage15 --bins $(BINS)

test-c-stage15:
	@if [ ! -x "$(C_BIN)" ]; then echo "Missing binary: $(C_BIN)"; echo "Build it with: make build-c"; exit 1; fi
	@python3 tests/integration/python/run_tests.py --stage stage15 --bins $(C_BIN)

test-stage16: check-bins
	@python3 tests/integration/python/run_tests.py --stage stage16 --bins $(BINS)

test-c-stage16:
	@if [ ! -x "$(C_BIN)" ]; then echo "Missing binary: $(C_BIN)"; echo "Build it with: make build-c"; exit 1; fi
	@python3 tests/integration/python/run_tests.py --stage stage16 --bins $(C_BIN)

test-stage17: check-bins
	@python3 tests/integration/python/run_tests.py --stage stage17 --bins $(BINS)

test-c-stage17:
	@if [ ! -x "$(C_BIN)" ]; then echo "Missing binary: $(C_BIN)"; echo "Build it with: make build-c"; exit 1; fi
	@python3 tests/integration/python/run_tests.py --stage stage17 --bins $(C_BIN)

test-stage18: check-bins
	@python3 tests/integration/python/run_tests.py --stage stage18 --bins $(BINS)

test-c-stage18:
	@if [ ! -x "$(C_BIN)" ]; then echo "Missing binary: $(C_BIN)"; echo "Build it with: make build-c"; exit 1; fi
	@python3 tests/integration/python/run_tests.py --stage stage18 --bins $(C_BIN)

test-all-stages: check-bins
	@python3 tests/integration/python/run_tests.py --stage all --bins $(BINS)

test-case:
	@if [ -z "$(CASE)" ] || [ -z "$(BIN)" ]; then \
		echo "Usage: make test-case CASE=<case-name> BIN=<binary>"; \
		echo "Example: make test-case CASE=help-command-works BIN=bin/c-db"; \
		echo ""; \
		echo "Available cases:"; \
		cd tests/integration/python && python3 test_single_case.py 2>&1 | grep -A 20 "Available"; \
		exit 1; \
	fi
	@BIN_PATH=$$(cd . && pwd)/$(BIN); \
	if [ ! -x "$$BIN_PATH" ]; then echo "Missing binary: $$BIN_PATH"; exit 1; fi; \
	cd tests/integration/python && python3 test_single_case.py "$(CASE)" "$$BIN_PATH"

clean:
	rm -rf $(BIN_DIR)
