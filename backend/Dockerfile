FROM ruby:3.4-alpine

RUN apk add --no-cache \
  build-base \
  postgresql-dev \
  tzdata \
  git \
  bash \
  curl

WORKDIR /rails

COPY Gemfile Gemfile.lock* ./
RUN bundle install

COPY . .

EXPOSE 3000
CMD ["bin/rails", "server", "-b", "0.0.0.0", "-p", "3000"]
