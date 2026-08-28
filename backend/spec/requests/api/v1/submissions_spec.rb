require "rails_helper"

RSpec.describe "Api::V1::Submissions" do
  let!(:user) do
    User.create!(
      email: "test@example.com",
      name: "Test User",
      password: "password123",
      password_confirmation: "password123"
    )
  end

  let(:auth_headers) { { "Authorization" => "Bearer #{user.authentication_token}" } }

  let(:valid_params) do
    {
      submission: {
        stage_slug: "database/repl",
        language_slug: "c",
        code_files: { "main.c" => "int main() { return 0; }" }
      }
    }
  end

  describe "POST /api/v1/submissions" do
    it "returns 401 without authentication" do
      post "/api/v1/submissions", params: valid_params, as: :json

      expect(response).to have_http_status(:unauthorized)
    end

    it "creates a submission for authenticated user" do
      expect {
        post "/api/v1/submissions", params: valid_params, headers: auth_headers, as: :json
      }.to change(Submission, :count).by(1)

      expect(response).to have_http_status(:accepted)
      json = response.parsed_body
      expect(json["stage_slug"]).to eq("database/repl")
      expect(json["language_slug"]).to eq("c")
      expect(json["status"]).to eq("pending")
    end

    it "associates the submission with the current user" do
      post "/api/v1/submissions", params: valid_params, headers: auth_headers, as: :json

      submission = Submission.last
      expect(submission.user).to eq(user)
    end

    it "returns 422 with invalid language" do
      invalid_params = valid_params.deep_merge(submission: { language_slug: "python" })
      post "/api/v1/submissions", params: invalid_params, headers: auth_headers, as: :json

      expect(response).to have_http_status(:unprocessable_entity)
      expect(response.parsed_body["errors"]).to include(a_string_matching(/language/i))
    end

    it "returns 422 without stage_slug" do
      missing_params = { submission: { language_slug: "c", code_files: { "main.c" => "int main() {}" } } }
      post "/api/v1/submissions", params: missing_params, headers: auth_headers, as: :json

      expect(response).to have_http_status(:unprocessable_content)
    end
  end

  describe "GET /api/v1/submissions/:id" do
    let!(:submission) do
      Submission.create!(
        user: user,
        stage_slug: "database/repl",
        language_slug: "c",
        code_files: { "main.c" => "int main() {}" },
        status: :passed
      )
    end

    it "returns 401 without authentication" do
      get "/api/v1/submissions/#{submission.id}"

      expect(response).to have_http_status(:unauthorized)
    end

    it "returns the submission for authenticated user" do
      get "/api/v1/submissions/#{submission.id}", headers: auth_headers

      expect(response).to have_http_status(:ok)
      json = response.parsed_body
      expect(json["id"]).to eq(submission.id)
      expect(json["status"]).to eq("passed")
      expect(json["test_run"]).to be_nil
    end

    it "does not return another user's submission" do
      other_user = User.create!(
        email: "other@example.com",
        name: "Other",
        password: "password123",
        password_confirmation: "password123"
      )
      other_submission = Submission.create!(
        user: other_user,
        stage_slug: "database/repl",
        language_slug: "c",
        code_files: { "main.c" => "int main() {}" }
      )

      get "/api/v1/submissions/#{other_submission.id}", headers: auth_headers

      expect(response).to have_http_status(:not_found)
    end

    it "includes test_run and test_cases when present" do
      test_run = submission.create_test_run!(
        status: :completed,
        compile_logs: "OK",
        total_passed: 1,
        total_failed: 0,
        duration_ms: 150
      )
      test_run.test_case_results.create!(
        case_name: "exits on .exit",
        passed: true,
        input_given: ".exit",
        expected_output: "",
        actual_output: ""
      )

      get "/api/v1/submissions/#{submission.id}", headers: auth_headers

      json = response.parsed_body
      expect(json["test_run"]["status"]).to eq("completed")
      expect(json["test_run"]["total_passed"]).to eq(1)
      expect(json["test_run"]["test_cases"].length).to eq(1)
      expect(json["test_run"]["test_cases"][0]["name"]).to eq("exits on .exit")
    end
  end
end
