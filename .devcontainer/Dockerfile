FROM node:20
RUN apt-get update && apt-get install -y \
    git \
    curl \
    bash \
    postgresql-client \
    unzip \
    gnupg \
    software-properties-common \
    jq \
    build-essential \
    libsqlite3-dev \
    zlib1g-dev \
    sudo \
    && rm -rf /var/lib/apt/lists/*

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

RUN curl -L "https://github.com/aws/aws-sam-cli/releases/latest/download/aws-sam-cli-linux-x86_64.zip" \
      -o /tmp/sam.zip \
    && unzip /tmp/sam.zip -d /tmp/sam-install \
    && /tmp/sam-install/install \
    && rm -rf /tmp/sam.zip /tmp/sam-install

RUN groupadd -f docker && usermod -aG docker node

# Give node user docker access via group
RUN groupadd -f docker \
    && usermod -aG docker node \
    && mkdir -p /etc/sudoers.d \
    && echo "node ALL=(ALL) NOPASSWD: /bin/chmod" \
       > /etc/sudoers.d/node-docker \
    && chmod 0440 /etc/sudoers.d/node-docker
        
WORKDIR /workspace
USER node