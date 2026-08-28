require "rails_helper"

RSpec.describe "Api::V1::Profiles" do
  let!(:user) do
    User.create!(
      email: "profile-test@example.com",
      name: "Original Name",
      password: "password123",
      password_confirmation: "password123"
    )
  end

  let(:headers) { { "Authorization" => "Bearer #{user.authentication_token}" } }

  describe "PUT /api/v1/me" do
    it "updates the user name" do
      put "/api/v1/me", params: { name: "New Name" }, headers: headers, as: :json

      expect(response).to have_http_status(:ok)
      json = response.parsed_body
      expect(json["name"]).to eq("New Name")
      expect(user.reload.name).to eq("New Name")
    end

    it "updates the password with correct current password" do
      put "/api/v1/me",
        params: { current_password: "password123", password: "newpassword456" },
        headers: headers, as: :json

      expect(response).to have_http_status(:ok)
      expect(user.reload.authenticate("newpassword456")).to be_truthy
    end

    it "rejects password change with wrong current password" do
      put "/api/v1/me",
        params: { current_password: "wrong", password: "newpassword456" },
        headers: headers, as: :json

      expect(response).to have_http_status(:unprocessable_content)
      json = response.parsed_body
      expect(json["error"]).to include("incorrect")
    end

    it "updates the avatar URL" do
      put "/api/v1/me",
        params: { avatar_url: "data:image/png;base64,iVBOR..." },
        headers: headers, as: :json

      expect(response).to have_http_status(:ok)
      json = response.parsed_body
      expect(json["avatar_url"]).to eq("data:image/png;base64,iVBOR...")
    end

    it "returns 401 without authentication" do
      put "/api/v1/me", params: { name: "Hacker" }, as: :json

      expect(response).to have_http_status(:unauthorized)
    end
  end
end
