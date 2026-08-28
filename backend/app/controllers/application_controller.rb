class ApplicationController < ActionController::API
  private

  def current_user
    return @current_user if defined?(@current_user)
    token = request.headers["Authorization"]&.remove("Bearer ")
    @current_user = User.find_by(authentication_token: token) if token
  end

  def authenticate_user!
    render json: { error: "Unauthorized" }, status: :unauthorized unless current_user
  end
end
