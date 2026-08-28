require "rails_helper"

RSpec.describe "Api::V1::Stages" do
  before do
    Stage.create!(slug: "database/repl", part: "database", stage_number: 1, title: "User REPL", description: "Build a REPL.")
    Stage.create!(slug: "database/lexer", part: "database", stage_number: 2, title: "SQL Lexer", description: "Tokenize SQL.")
  end

  describe "GET /api/v1/stages" do
    it "returns all stages ordered by stage_number" do
      get "/api/v1/stages"

      expect(response).to have_http_status(:ok)
      json = response.parsed_body
      expect(json.length).to eq(2)
      expect(json[0]["slug"]).to eq("database/repl")
      expect(json[1]["slug"]).to eq("database/lexer")
    end

    it "does not require authentication" do
      get "/api/v1/stages"
      expect(response).to have_http_status(:ok)
    end
  end

  describe "GET /api/v1/stages/:part/:stage" do
    it "returns a specific stage" do
      get "/api/v1/stages/database/repl"

      expect(response).to have_http_status(:ok)
      json = response.parsed_body
      expect(json["slug"]).to eq("database/repl")
      expect(json["title"]).to eq("User REPL")
    end
  end
end
