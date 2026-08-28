require "rails_helper"

RSpec.describe "Api::V1::Workspaces" do
  let!(:user) do
    User.create!(
      email: "workspace-test@example.com",
      name: "Workspace User",
      password: "password123",
      password_confirmation: "password123"
    )
  end

  let(:auth_headers) { { "Authorization" => "Bearer #{user.authentication_token}" } }

  let(:code_files) { { "c-droid/main.c" => "int main() { return 0; }", "c-droid/repl.c" => "void repl() {}" } }

  describe "PUT /api/v1/workspaces/:stage_slug/:language_slug (upsert)" do
    it "returns 401 without authentication" do
      put "/api/v1/workspaces/database/repl/c",
        params: { workspace: { code_files: code_files } }, as: :json

      expect(response).to have_http_status(:unauthorized)
    end

    it "creates a new workspace" do
      expect {
        put "/api/v1/workspaces/database/repl/c",
          params: { workspace: { code_files: code_files } },
          headers: auth_headers, as: :json
      }.to change(Workspace, :count).by(1)

      expect(response).to have_http_status(:created)
      json = response.parsed_body
      expect(json["stage_slug"]).to eq("database/repl")
      expect(json["language_slug"]).to eq("c")
    end

    it "updates an existing workspace" do
      Workspace.create!(user: user, stage_slug: "database/repl", language_slug: "c", code_files: code_files)

      updated_files = { "c-droid/main.c" => "int main() { return 42; }" }
      expect {
        put "/api/v1/workspaces/database/repl/c",
          params: { workspace: { code_files: updated_files } },
          headers: auth_headers, as: :json
      }.not_to change(Workspace, :count)

      expect(response).to have_http_status(:ok)

      workspace = user.workspaces.find_by(stage_slug: "database/repl", language_slug: "c")
      expect(workspace.code_files).to eq(updated_files.stringify_keys)
    end

    it "associates workspace with the current user" do
      put "/api/v1/workspaces/database/repl/c",
        params: { workspace: { code_files: code_files } },
        headers: auth_headers, as: :json

      workspace = user.workspaces.find_by(stage_slug: "database/repl", language_slug: "c")
      expect(workspace).to be_present
    end
  end

  describe "GET /api/v1/workspaces/:stage_slug/:language_slug" do
    it "returns 401 without authentication" do
      get "/api/v1/workspaces/database/repl/c"
      expect(response).to have_http_status(:unauthorized)
    end

    it "returns the workspace with code_files" do
      workspace = Workspace.create!(user: user, stage_slug: "database/repl", language_slug: "c", code_files: code_files)

      get "/api/v1/workspaces/database/repl/c", headers: auth_headers

      expect(response).to have_http_status(:ok)
      json = response.parsed_body
      expect(json["id"]).to eq(workspace.id)
      expect(json["code_files"]).to eq(code_files.stringify_keys)
    end

    it "returns 404 when workspace does not exist" do
      get "/api/v1/workspaces/database/repl/c", headers: auth_headers
      expect(response).to have_http_status(:not_found)
    end

    it "does not return another user's workspace" do
      other_user = User.create!(
        email: "other-ws@example.com", name: "Other",
        password: "password123", password_confirmation: "password123"
      )
      Workspace.create!(user: other_user, stage_slug: "database/repl", language_slug: "c", code_files: code_files)

      get "/api/v1/workspaces/database/repl/c", headers: auth_headers
      expect(response).to have_http_status(:not_found)
    end
  end

  describe "GET /api/v1/workspaces (index)" do
    it "returns 401 without authentication" do
      get "/api/v1/workspaces"
      expect(response).to have_http_status(:unauthorized)
    end

    it "lists workspaces for current user" do
      Workspace.create!(user: user, stage_slug: "database/repl", language_slug: "c", code_files: code_files)
      Workspace.create!(user: user, stage_slug: "database/lexer", language_slug: "rust", code_files: { "rust-droid/src/main.rs" => "fn main() {}" })

      get "/api/v1/workspaces", headers: auth_headers

      expect(response).to have_http_status(:ok)
      json = response.parsed_body
      expect(json.length).to eq(2)
      expect(json.first).to include("stage_slug", "language_slug", "file_count", "updated_at")
    end

    it "does not include other users' workspaces" do
      other_user = User.create!(
        email: "other-ws2@example.com", name: "Other",
        password: "password123", password_confirmation: "password123"
      )
      Workspace.create!(user: other_user, stage_slug: "database/repl", language_slug: "c", code_files: code_files)

      get "/api/v1/workspaces", headers: auth_headers

      expect(response).to have_http_status(:ok)
      expect(response.parsed_body).to be_empty
    end
  end

  describe "DELETE /api/v1/workspaces/:stage_slug/:language_slug" do
    it "returns 401 without authentication" do
      delete "/api/v1/workspaces/database/repl/c"
      expect(response).to have_http_status(:unauthorized)
    end

    it "deletes the workspace" do
      Workspace.create!(user: user, stage_slug: "database/repl", language_slug: "c", code_files: code_files)

      expect {
        delete "/api/v1/workspaces/database/repl/c", headers: auth_headers
      }.to change(Workspace, :count).by(-1)

      expect(response).to have_http_status(:no_content)
    end

    it "returns 204 even when workspace does not exist" do
      delete "/api/v1/workspaces/database/repl/c", headers: auth_headers
      expect(response).to have_http_status(:no_content)
    end
  end

  describe "submission creates workspace as side-effect" do
    it "upserts workspace when creating a submission" do
      expect {
        post "/api/v1/submissions",
          params: { submission: { stage_slug: "database/repl", language_slug: "c", code_files: code_files } },
          headers: auth_headers, as: :json
      }.to change(Workspace, :count).by(1)

      workspace = user.workspaces.find_by(stage_slug: "database/repl", language_slug: "c")
      expect(workspace).to be_present
      expect(workspace.code_files).to eq(code_files.stringify_keys)
    end
  end
end
