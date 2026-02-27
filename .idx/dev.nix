
# To learn more about how to use Nix to configure your environment
# see: https://developers.google.com/idx/guides/customize-idx-env
{ pkgs, ... }: {
  # Which nixpkgs channel to use.
  channel = "stable-24.05"; # or "unstable"

  # Use https://search.nixos.org/packages to find packages
  packages = [
    # THIS IS THE DEFINITIVE FIX:
    # Create a complete Python 3.11 environment that includes pip.
    # This ensures that pip is correctly bound to the python interpreter.
    (pkgs.python311.withPackages (ps: [
      ps.pip
    ]))
    pkgs.nodejs_20
    pkgs.awscli
    pkgs.aws-sam-cli
    pkgs.docker
  ];

  # Enable the Docker daemon service
  services.docker = {
    enable = true;
  };

  # Sets environment variables in the workspace
  env = {};

  idx = {
    extensions = [
      "google.gemini-cli-vscode-ide-companion"
      "dbaeumer.vscode-eslint"
    ];

    workspace = {
      onCreate = {
        default.openFiles = [ ".idx/dev.nix" "README.md" "智汇云-erp-(cloud-native-edition)/pages/LoginPage.tsx" ];
      };
      onStart = {
        build-frontend = "cd '智汇云-erp-(cloud-native-edition)' && npm install && npm run build";
      };
    };
  };
}
