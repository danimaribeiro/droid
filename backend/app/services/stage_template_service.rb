require "pathname"

class StageTemplateService
  BASE_DIR = Rails.root.join("templates")

  LANG_FOLDER_PREFIX = {
    "c" => "c-droid",
    "cpp" => "cpp-droid",
    "rust" => "rust-droid",
    "zig" => "zig-droid"
  }.freeze

  def self.fetch(stage_slug, language = "c")
    stage_dir = BASE_DIR.join(stage_slug, language)
    return {} unless Dir.exist?(stage_dir)

    prefix = LANG_FOLDER_PREFIX.fetch(language, "#{language}-droid")
    result = {}

    Dir.glob(File.join(stage_dir, "**", "*")).each do |file_path|
      next if File.directory?(file_path)

      relative_path = Pathname.new(file_path).relative_path_from(stage_dir).to_s
      full_target_path = File.join(prefix, relative_path)
      result[full_target_path] = File.read(file_path)
    end

    result
  end
end
