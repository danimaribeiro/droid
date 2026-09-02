FROM ruby:3.4-slim

RUN apt-get update -qq && apt-get install -y --no-install-recommends \
  build-essential \
  libpq-dev \
  git \
  curl \
  ca-certificates \
  && rm -rf /var/lib/apt/lists/*

# Optional corporate CA. The cert is gitignored, so a bare `COPY` breaks the
# build on any clone that lacks it; the glob makes it a no-op when absent.
# It is only needed behind a TLS-intercepting proxy.
COPY Gemfile zscaler-ca.crt* /tmp/ca/
RUN if [ -f /tmp/ca/zscaler-ca.crt ]; then \
      cp /tmp/ca/zscaler-ca.crt /usr/local/share/ca-certificates/ && \
      update-ca-certificates; \
    fi; \
    rm -rf /tmp/ca

WORKDIR /rails

COPY Gemfile Gemfile.lock* ./
RUN bundle install

COPY . .

RUN chmod +x bin/docker-entrypoint

EXPOSE 3000
ENTRYPOINT ["bin/docker-entrypoint"]
CMD ["bin/rails", "server", "-b", "0.0.0.0", "-p", "3000"]
