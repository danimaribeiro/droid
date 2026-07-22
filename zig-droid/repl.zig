const std = @import("std");

pub fn parse_command(command: []const u8) void {
    const trm_cmd = std.mem.trim(u8, command, " \r\n\t");
    if (std.mem.eql(u8, trm_cmd, ".exit")) {
        std.debug.print("exiting.. good bye!\n", .{});
        std.process.exit(0);
    } else if (std.mem.eql(u8, trm_cmd, ".help")) {
        std.debug.print("Available commands:\n", .{});
        std.debug.print(".exit - Exit the program\n", .{});
        std.debug.print(".help - Show this help message\n", .{});
    } else {
        std.debug.print("[ERROR:00100] Unknown command: {s}\n", .{trm_cmd});
    }
}
