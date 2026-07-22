const std = @import("std");
const parse_command = @import("repl.zig").parse_command;

pub fn main(init: std.process.Init) !void {
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

    while (true) {
        std.debug.print("> ", .{});
        const line = try std.io.getStdIn().readUntilDelimiterOrEofAlloc(arena_allocator, '\n', 1024);
        defer arena_allocator.free(line);

        if (line.len == 0) {
            continue; // Ignore empty lines
        }
        parse_command(line);
    }
}
