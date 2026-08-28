require "rails_helper"

RSpec.describe "POST /api/v1/signup", type: :request do
  let(:valid_params) { { name: "Test User", email: "test@example.com", password: "password123" } }

  it "creates a new user and returns a token" do
    expect {
      post "/api/v1/signup", params: valid_params
    }.to change(User, :count).by(1)

    expect(response).to have_http_status(:created)
    body = response.parsed_body
    expect(body["token"]).to be_present
    expect(body["user"]["email"]).to eq("test@example.com")
    expect(body["user"]["name"]).to eq("Test User")
    expect(body["user"]["admin"]).to eq(false)
  end

  it "returns the same response shape as login" do
    post "/api/v1/signup", params: valid_params
    body = response.parsed_body
    expect(body.keys).to match_array(%w[token user])
    expect(body["user"].keys).to match_array(%w[id email name admin])
  end

  it "returns 422 when email is already taken" do
    User.create!(name: "Existing", email: "test@example.com", password: "password123")

    post "/api/v1/signup", params: valid_params
    expect(response).to have_http_status(:unprocessable_content)
    body = response.parsed_body
    expect(body["errors"]).to include("Email has already been taken")
  end

  it "returns 422 when name is blank" do
    post "/api/v1/signup", params: valid_params.merge(name: "")
    expect(response).to have_http_status(:unprocessable_content)
    body = response.parsed_body
    expect(body["errors"]).to include("Name can't be blank")
  end

  it "returns 422 when password is blank" do
    post "/api/v1/signup", params: valid_params.merge(password: "")
    expect(response).to have_http_status(:unprocessable_content)
  end
end
