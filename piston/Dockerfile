FROM ghcr.io/engineer-man/piston:latest

# Patch isolate sandbox to mount all Piston packages, not just the active language.
# This lets bash scripts access cargo, zig, etc. for multi-language build+test pipelines.
RUN sed -i 's|`--dir=${this.runtime.pkgdir}`,|`--dir=${this.runtime.pkgdir}`,\n                `--dir=/piston/packages`,|' /piston_api/src/job.js

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
