Rails.application.config.middleware.insert_before 0, Rack::Cors do
  allow do
    origins "https://danimar.dev",
            "https://www.danimar.dev",
            "http://localhost:3000",
            "http://localhost:4000",
            "http://localhost:5173",
            "http://127.0.0.1:3000",
            "http://127.0.0.1:4000"

    resource "*",
      headers: :any,
      methods: [:get, :post, :put, :patch, :delete, :options, :head],
      expose: ["Authorization"]
  end
end
