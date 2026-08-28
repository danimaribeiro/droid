Rails.application.routes.draw do
  namespace :api do
    namespace :v1 do
      resources :submissions, only: [:create, :show]

      post "login", to: "sessions#create"
      get "me", to: "sessions#me"

      get "stages/:part/:stage/template", to: "stages#template"
      get "stages/:part/:stage", to: "stages#show"
      get "stages/*id/template", to: "stages#template"
      get "stages/*id", to: "stages#show"
      get "stages", to: "stages#index"
    end
  end

  get "/health", to: ->(env) { [200, { "Content-Type" => "application/json" }, [{ status: "ok" }.to_json]] }
end
