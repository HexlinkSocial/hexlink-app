FROM node:24
RUN apt-get update && apt-get install -y \
    git \
    curl \
    bash \
    postgresql-client \
    unzip \
    gnupg \
    jq \
    build-essential \
    libsqlite3-dev \
    zlib1g-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Docker CLI (client only — talks to host daemon via mounted socket)
RUN curl -fsSL https://download.docker.com/linux/static/stable/x86_64/docker-27.3.1.tgz \
    -o docker.tgz \
    && tar xzvf docker.tgz --strip-components=1 -C /usr/local/bin docker/docker \
    && rm docker.tgz

# Give node access to the mounted docker.sock (owned root:root on the host side)
RUN usermod -aG root node

# Install AWS CLI
RUN curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip" \
    && unzip awscliv2.zip \
    && ./aws/install \
    && rm -rf awscliv2.zip aws

# Install Terraform
RUN curl -fsSL https://apt.releases.hashicorp.com/gpg | gpg --dearmor -o /usr/share/keyrings/hashicorp-archive-keyring.gpg \
    && echo "deb [signed-by=/usr/share/keyrings/hashicorp-archive-keyring.gpg] https://apt.releases.hashicorp.com $(. /etc/os-release && echo $VERSION_CODENAME) main" \
    | tee /etc/apt/sources.list.d/hashicorp.list \
    && apt-get update && apt-get install -y terraform \
    && rm -rf /var/lib/apt/lists/*

# Install tippecanoe v2.x (from felt/tippecanoe)
RUN git clone https://github.com/felt/tippecanoe.git /tmp/tippecanoe \
    && cd /tmp/tippecanoe \
    && make -j$(nproc) \
    && make install \
    && rm -rf /tmp/tippecanoe

# Install pmtiles CLI
RUN curl -L "https://github.com/protomaps/go-pmtiles/releases/download/v1.30.3/go-pmtiles_1.30.3_Linux_x86_64.tar.gz" \
    | tar -xz -C /usr/local/bin pmtiles \
    && chmod +x /usr/local/bin/pmtiles

# Install aws-sam cli
RUN curl -L "https://github.com/aws/aws-sam-cli/releases/latest/download/aws-sam-cli-linux-x86_64.zip" \
      -o /tmp/sam.zip \
    && unzip /tmp/sam.zip -d /tmp/sam-install \
    && /tmp/sam-install/install \
    && rm -rf /tmp/sam.zip /tmp/sam-install

WORKDIR /workspace
USER node