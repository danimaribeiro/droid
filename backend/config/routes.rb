Rails.application.routes.draw do
  namespace :api do
    namespace :v1 do
      resources :submissions, only: [:index, :create, :show]

      resources :workspaces, only: [:index]
      get "workspaces/:stage_slug/:language_slug", to: "workspaces#show", constraints: { stage_slug: %r{[^/]+/[^/]+} }
      put "workspaces/:stage_slug/:language_slug", to: "workspaces#upsert", constraints: { stage_slug: %r{[^/]+/[^/]+} }
      delete "workspaces/:stage_slug/:language_slug", to: "workspaces#destroy", constraints: { stage_slug: %r{[^/]+/[^/]+} }

      post "login", to: "sessions#create"
      post "signup", to: "registrations#create"
      get "me", to: "sessions#me"
      put "me", to: "profiles#update"
      delete "me/progress", to: "profiles#reset_progress"

      get "stages/:part/:stage/template", to: "stages#template"
      get "stages/:part/:stage", to: "stages#show"
      get "stages/*id/template", to: "stages#template"
      get "stages/*id", to: "stages#show"
      get "stages", to: "stages#index"
    end
  end

  get "/health", to: ->(env) { [200, { "Content-Type" => "application/json" }, [{ status: "ok" }.to_json]] }
end
