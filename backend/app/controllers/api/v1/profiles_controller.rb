module Api
  module V1
    class ProfilesController < ::ApplicationController
      before_action :authenticate_user!

      def update
        if params[:current_password].present? && params[:password].present?
          unless current_user.authenticate(params[:current_password])
            return render json: { error: "Current password is incorrect" }, status: :unprocessable_content
          end
          current_user.password = params[:password]
        end

        current_user.name = params[:name] if params[:name].present?
        current_user.avatar_url = params[:avatar_url] if params.key?(:avatar_url)

        if current_user.save
          render json: {
            id: current_user.id,
            email: current_user.email,
            name: current_user.name,
            admin: current_user.admin,
            avatar_url: current_user.avatar_url
          }
        else
          render json: { errors: current_user.errors.full_messages }, status: :unprocessable_content
        end
      end
    end
  end
end
