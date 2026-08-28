module Api
  module V1
    class RegistrationsController < ::ApplicationController
      def create
        user = User.new(
          name: params[:name],
          email: params[:email],
          password: params[:password]
        )

        if user.save
          render json: {
            token: user.authentication_token,
            user: { id: user.id, email: user.email, name: user.name, admin: user.admin }
          }, status: :created
        else
          render json: { errors: user.errors.full_messages }, status: :unprocessable_content
        end
      end
    end
  end
end
