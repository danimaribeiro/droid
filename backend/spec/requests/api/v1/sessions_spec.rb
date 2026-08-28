require "rails_helper"

RSpec.describe "Api::V1::Sessions" do
  let!(:user) do
    User.create!(
      email: "test@example.com",
      name: "Test User",
      password: "password123",
      password_confirmation: "password123",
      admin: false
    )
  end

  describe "POST /api/v1/login" do
    it "returns token and user info with valid credentials" do
      post "/api/v1/login", params: { email: "test@example.com", password: "password123" }, as: :json

      expect(response).to have_http_status(:ok)
      json = response.parsed_body
      expect(json["token"]).to eq(user.authentication_token)
      expect(json["user"]["email"]).to eq("test@example.com")
      expect(json["user"]["name"]).to eq("Test User")
      expect(json["user"]["admin"]).to be false
    end

    it "returns 401 with wrong password" do
      post "/api/v1/login", params: { email: "test@example.com", password: "wrong" }, as: :json

      expect(response).to have_http_status(:unauthorized)
      expect(response.parsed_body["error"]).to eq("Invalid email or password")
    end

    it "returns 401 with non-existent email" do
      post "/api/v1/login", params: { email: "nobody@example.com", password: "password123" }, as: :json

      expect(response).to have_http_status(:unauthorized)
    end
  end

  describe "GET /api/v1/me" do
    it "returns user info with valid token" do
      get "/api/v1/me", headers: { "Authorization" => "Bearer #{user.authentication_token}" }

      expect(response).to have_http_status(:ok)
      json = response.parsed_body
      expect(json["email"]).to eq("test@example.com")
      expect(json["id"]).to eq(user.id)
    end

    it "returns 401 without token" do
      get "/api/v1/me"

      expect(response).to have_http_status(:unauthorized)
      expect(response.parsed_body["error"]).to eq("Unauthorized")
    end

    it "returns 401 with invalid token" do
      get "/api/v1/me", headers: { "Authorization" => "Bearer bad_token" }

      expect(response).to have_http_status(:unauthorized)
    end
  end
end
