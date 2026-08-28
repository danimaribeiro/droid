def run_repl
  loop do
    print "db > "
    $stdout.flush
    line = $stdin.gets
    break if line.nil?
    line = line.chomp.strip
    break if line == ".exit"
    puts "Unrecognized command '#{line}'."
  end
end
