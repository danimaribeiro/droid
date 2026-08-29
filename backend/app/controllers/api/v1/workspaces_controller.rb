module Api
  module V1
    class WorkspacesController < ::ApplicationController
      before_action :authenticate_user!

      def index
        workspaces = current_user.workspaces.order(updated_at: :desc)

        render json: workspaces.map { |w|
          {
            id: w.id,
            stage_slug: w.stage_slug,
            language_slug: w.language_slug,
            file_count: w.code_files.size,
            updated_at: w.updated_at
          }
        }
      end

      def show
        workspace = current_user.workspaces.find_by!(
          stage_slug: params[:stage_slug],
          language_slug: params[:language_slug]
        )

        render json: {
          id: workspace.id,
          stage_slug: workspace.stage_slug,
          language_slug: workspace.language_slug,
          code_files: workspace.code_files,
          updated_at: workspace.updated_at
        }
      end

      def upsert
        workspace = current_user.workspaces.find_or_initialize_by(
          stage_slug: params[:stage_slug],
          language_slug: params[:language_slug]
        )

        if workspace.new_record?
          stage = Stage.find_by(slug: params[:stage_slug])
          if stage && stage.stage_number > 1
            prev = Stage.find_by(part: stage.part, stage_number: stage.stage_number - 1)
            if prev && !current_user.submissions.where(stage_slug: prev.slug, language_slug: params[:language_slug], status: :passed).exists?
              return render json: { errors: ["Complete #{prev.title} first"] }, status: :forbidden
            end
          end
        end

        workspace.code_files = params.require(:workspace).permit(code_files: {})[:code_files] || {}

        if workspace.save
          render json: {
            id: workspace.id,
            stage_slug: workspace.stage_slug,
            language_slug: workspace.language_slug,
            updated_at: workspace.updated_at
          }, status: workspace.previously_new_record? ? :created : :ok
        else
          render json: { errors: workspace.errors.full_messages }, status: :unprocessable_content
        end
      end

      def destroy
        workspace = current_user.workspaces.find_by(
          stage_slug: params[:stage_slug],
          language_slug: params[:language_slug]
        )

        workspace&.destroy
        head :no_content
      end
    end
  end
end
