module Api
  module V1
    class SessionsController < ::ApplicationController
      def create
        user = User.find_by(email: params[:email])

        if user&.authenticate(params[:password])
          render json: {
            token: user.authentication_token,
            user: { id: user.id, email: user.email, name: user.name, admin: user.admin, avatar_url: user.avatar_url }
          }
        else
          render json: { error: "Invalid email or password" }, status: :unauthorized
        end
      end

      def me
        authenticate_user!
        return unless current_user

        render json: {
          id: current_user.id,
          email: current_user.email,
          name: current_user.name,
          admin: current_user.admin,
          avatar_url: current_user.avatar_url
        }
      end
    end
  end
end
