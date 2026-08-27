module Api
  module V1
    class StagesController < ::ApplicationController
      def index
        stages = Stage.order(:stage_number)
        render json: stages.map { |s| format_stage(s) }
      end

      def show
        slug = extract_slug
        stage = Stage.find_by(slug: slug) || Stage.new(slug: slug, title: slug.humanize, stage_number: 1)
        render json: format_stage(stage)
      end

      def template
        slug = extract_slug
        language = params[:language] || "c"
        files = StageTemplateService.fetch(slug, language)

        if files.empty?
          render json: { error: "Template not found for #{slug} (#{language})" }, status: :not_found
        else
          render json: {
            stage_slug: slug,
            language_slug: language,
            files: files
          }
        end
      end

      private

      def extract_slug
        if params[:part].present? && params[:stage].present?
          "#{params[:part]}/#{params[:stage]}"
        else
          params[:id]
        end
      end

      def format_stage(stage)
        {
          id: stage.id,
          slug: stage.slug,
          part: stage.part,
          stage_number: stage.stage_number,
          title: stage.title,
          description: stage.description
        }
      end
    end
  end
end
