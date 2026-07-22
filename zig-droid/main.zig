const std = @import("std");
const parse_command = @import("repl.zig").parse_command;

pub fn main(init: std.process.Init) !void {
    const io = init.io;
    const arena_allocator = init.arena.allocator();

    const args = try init.minimal.args.toSlice(arena_allocator);

    if (args.len > 1) {
        if (std.mem.eql(u8, args[1], "-c")) {
            if (args.len < 3) {
                std.debug.print("[ERROR:00201] Missing argument for -c\n", .{});
                std.process.exit(1);
            }
            const command = args[2];
            parse_command(command);
            std.process.exit(0);
        } else {
            std.debug.print("[ERROR:00200] Unknown option: {s}\n", .{args[1]});
            std.process.exit(1);
        }
    }

    std.debug.print("Welcome to droid-zig!\n", .{});

    const stdin_file = std.Io.File.stdin();
    var stdin_buf: [4096]u8 = undefined;
    var stdin_reader = stdin_file.reader(io, &stdin_buf);
    const stdin = &stdin_reader.interface;

    while (true) {
        std.debug.print(">", .{});
        const raw = stdin.takeDelimiterInclusive('\n') catch |err| switch (err) {
            error.EndOfStream => break,
            else => return err,
        };
        const line = std.mem.trim(u8, raw, " \r\n\t");
        if (line.len == 0) continue;

        parse_command(line);
    }
    std.debug.print("exiting.. good bye!\n", .{});
}
